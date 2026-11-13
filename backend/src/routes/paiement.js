const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CAMERPAY_TOKEN = process.env.CAMERPAY_API_TOKEN;
const CAMERPAY_HMAC_SECRET = process.env.CAMERPAY_HMAC_SECRET;
const CALLBACK_URL = process.env.CAMERPAY_CALLBACK_URL;

// ✅ ROUTE 1 : Initialiser un paiement (selon la doc officielle CamerPay)
router.post('/initier', async (req, res) => {
  try {
    const { userId, type, itemId, montant, description, customerName, customerEmail, customerPhone } = req.body;

   // ✅ Validation souple : on exige juste les infos essentielles
  if (!userId || !type || !itemId || !montant) {
    return res.status(400).json({ error: 'Données de paiement incomplètes' });
  }

    // Générer un ID de facture unique
    const invoiceId = `ASTRO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    // ✅ SÉCURITÉ : Forcer un montant minimum de 100 FCFA (exigence CamerPay)
    const montantFinal = Math.max(parseInt(montant), 100);

    const payload = {
      amount: montantFinal,  // ← Utiliser montantFinal au lieu de montant
      currency: 'XAF',
      merchant_invoice_id: invoiceId,
      customer_name: customerName || 'Client ASTRONOTE',
      customer_email: customerEmail || 'test@astronote.com',
      customer_phone: customerPhone || '600000000',
      merchant_callback_url: CALLBACK_URL,
      merchant_return_url: 'https://astronote.vercel.app/merci',
      source: 'api'
    };

    console.log('📤 Envoi à CamerPay:', payload);

    // Appel à l'API CamerPay (URL CORRECTE)
    const response = await fetch('https://camerpay.biz/api/payment/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAMERPAY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Lire la réponse en texte brut
    const rawText = await response.text();
    console.log('📩 Réponse brute de CamerPay:', rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      data = { message: rawText, error: rawText };
    }

    if (!response.ok || !data.success) {
      console.error('❌ Erreur CamerPay:', data);
      return res.status(500).json({ error: data.message || 'Erreur lors de la création de la transaction' });
    }

    // ✅ Récupérer l'URL de paiement (pay_url selon la doc)
    const payUrl = data.pay_url;
    
    if (!payUrl) {
      return res.status(500).json({ error: "Aucune URL de paiement reçue", details: data });
    }

    res.json({ 
      success: true, 
      paymentUrl: payUrl,
      transactionUuid: data.transaction_uuid,
      invoiceId: invoiceId
    });

  } catch (error) {
    console.error('💥 Erreur critique initier paiement:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ ROUTE 2 : Webhook (selon la doc officielle CamerPay)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const payload = JSON.parse(req.body);
    console.log('🔔 Webhook CamerPay reçu:', payload);

    // ✅ Vérification HMAC-SHA256 selon la doc
    const { transaction_uuid, invoice_id, status, amount, signature } = payload;
    
    // Concaténer les champs dans l'ordre exact
    const dataToVerify = `${transaction_uuid}${invoice_id}${status}${amount}`;
    
    // Calculer le HMAC attendu
    const hmac = crypto.createHmac('sha256', CAMERPAY_HMAC_SECRET);
    hmac.update(dataToVerify);
    const expectedSignature = hmac.digest('hex');

    // Vérifier la signature
    if (signature !== expectedSignature) {
      console.error('❌ Signature HMAC invalide');
      return res.status(401).json({ error: 'Signature invalide' });
    }

    console.log('✅ Signature HMAC vérifiée');

    // Vérifier si le paiement est complété
    if (status === 'completed') {
      // Extraire les données de l'invoice_id (format: ASTRO-xxx-type-itemId-montant)
      const parts = invoice_id.split('-');
      const type = parts[2];
      const itemId = parts[3];
      const userId = parts[1]; // À adapter selon ton format

      // Mettre à jour la base de données
      if (type === 'album' && userId && itemId) {
        await prisma.achat.create({
          data: {
            userId: String(userId),
            albumId: parseInt(itemId),
            prixPaye: parseInt(amount),
            dateAchat: new Date(),
            actif: true
          }
        });
        console.log(`✅ Album ${itemId} acheté par l'utilisateur ${userId}`);
      }
    }

    // Toujours répondre 200 à CamerPay
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('💥 Erreur webhook:', error);
    res.status(500).json({ error: 'Erreur serveur webhook' });
  }
});

module.exports = router;