const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── GET : Récupérer tous les événements AVEC leurs catégories ───
router.get('/', async (req, res) => {
  try {
    const evenements = await prisma.evenement.findMany({
      orderBy: { date: 'asc' },
      include: { 
        categorieTickets: true // ✅ Inclut les catégories pour l'affichage frontend
      }
    });
    res.json(evenements);
  } catch (error) {
    console.error("Erreur récupération événements:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── GET : Récupérer un événement spécifique par ID ───
router.get('/:id', async (req, res) => {
  try {
    const evenement = await prisma.evenement.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { 
        categorieTickets: true // ✅ Inclut les catégories pour la page de détail
      }
    });
    
    if (!evenement) {
      return res.status(404).json({ error: "Événement introuvable" });
    }
    
    res.json(evenement);
  } catch (error) {
    console.error("Erreur récupération événement:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── POST : Créer un événement AVEC ses catégories de tickets ───
router.post('/', async (req, res) => {
  try {
    const { 
      titre, type, date, heure, lieu, pays, description, coverUrl, coverEmoji, 
      categories 
    } = req.body;

    // 1. Nettoyage des catégories : on ne garde que celles qui sont correctement remplies
    const categoriesPropres = (categories || []).filter(cat => 
      cat.nom && cat.nom.trim() !== "" && 
      !isNaN(parseFloat(cat.prix)) && 
      !isNaN(parseInt(cat.placesTotales))
    );

    // 2. Transaction Prisma : tout ou rien
    const resultat = await prisma.$transaction(async (tx) => {
      // Créer l'événement
      const evenement = await tx.evenement.create({
        data: {
          titre,
          type: type || "concert",
          date: new Date(date),
          heure: heure || "20:00",
          lieu,
          pays: pays || "🇨🇮",
          prix: 0, // Valeur par défaut pour éviter les erreurs de schema
          places: 99999, // Valeur par défaut
          description: description || "",
          coverUrl: coverUrl || null,
          coverEmoji: coverEmoji || "🎤"
        }
      });

      // Créer les catégories si elles existent
      if (categoriesPropres.length > 0) {
        await tx.categorieTicket.createMany({
          data: categoriesPropres.map(cat => ({
            nom: cat.nom.trim(),
            prix: parseFloat(cat.prix),
            placesTotales: parseInt(cat.placesTotales),
            placesVendues: 0,
            evenementId: evenement.id
          }))
        });
      }

      // Retourner l'événement avec ses catégories
      return await tx.evenement.findUnique({
        where: { id: evenement.id },
        include: { categorieTickets: true }
      });
    });

    res.status(201).json(resultat);
  } catch (error) {
    console.error("🔴 ERREUR CRÉATION ÉVÉNEMENT:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE : Supprimer un événement ───
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Supprimer d'abord les catégories associées (Cascade devrait le faire, mais on sécurise)
    await prisma.categorieTicket.deleteMany({
      where: { evenementId: id }
    });

    // Supprimer l'événement
    await prisma.evenement.delete({
      where: { id: id }
    });

    res.json({ success: true, message: "Événement supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression événement:", error);
    res.status(500).json({ error: error.message });
  }
});
// ─── POST : Vérifier / Scanner un ticket ───
router.post('/verifier', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        valide: false, 
        message: "Code manquant" 
      });
    }

    // 1. Chercher le ticket
    const ticket = await prisma.ticket.findUnique({
      where: { codeUnique: code.trim() },
      include: { 
        evenement: true, 
        categorie: true,
        user: { select: { nom: true, email: true } }
      }
    });

    if (!ticket) {
      return res.json({ 
        valide: false, 
        message: "❌ Ticket introuvable",
        type: "not_found"
      });
    }

    // 2. Vérifier si déjà utilisé
    if (ticket.utilise) {
      return res.json({ 
        valide: false, 
        message: `⚠️ Ticket DÉJÀ UTILISÉ le ${new Date(ticket.dateUtilisation).toLocaleString('fr-FR')}`,
        type: "already_used",
        ticket: {
          code: ticket.codeUnique,
          evenement: ticket.evenement.titre,
          categorie: ticket.categorie?.nom,
          acheteur: ticket.user?.nom || ticket.user?.email
        }
      });
    }

    // 3. Marquer comme utilisé
    const ticketMisAJour = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { 
        utilise: true, 
        dateUtilisation: new Date() 
      },
      include: { 
        evenement: true, 
        categorie: true,
        user: { select: { nom: true, email: true } }
      }
    });

    res.json({ 
      valide: true, 
      message: "✅ Ticket valide - Bienvenue !",
      type: "valid",
      ticket: {
        code: ticketMisAJour.codeUnique,
        evenement: ticketMisAJour.evenement.titre,
        categorie: ticketMisAJour.categorie?.nom,
        acheteur: ticketMisAJour.user?.nom || ticketMisAJour.user?.email,
        dateValidation: new Date().toLocaleString('fr-FR')
      }
    });
  } catch (error) {
    console.error("Erreur vérification ticket:", error);
    res.status(500).json({ valide: false, message: "Erreur serveur" });
  }
});

// ─── GET : Statistiques de scan d'un événement ───
router.get('/:id/stats-scan', async (req, res) => {
  try {
    const evenementId = parseInt(req.params.id);
    
    const stats = await prisma.ticket.groupBy({
      by: ['categorieId', 'utilise'],
      where: { evenementId },
      _count: true
    });

    const totalTickets = await prisma.ticket.count({ where: { evenementId } });
    const totalScannes = await prisma.ticket.count({ where: { evenementId, utilise: true } });

    res.json({ stats, totalTickets, totalScannes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST : Acheter des tickets ───
router.post('/acheter', async (req, res) => {
  try {
    const { evenementId, categorieId, quantite } = req.body;
    
    // ✅ ASTUCE : On prend l'ID du token (si middleware auth présent) OU du body
    const userId = req.user?.userId || req.body.userId;

    if (!evenementId || !categorieId || !quantite || !userId) {
      return res.status(400).json({ 
        error: 'Données manquantes pour l\'achat (userId, evenementId, categorieId, quantite).' 
      });
    }

    // 1. Vérifier la catégorie et le stock disponible
    const categorie = await prisma.categorieTicket.findUnique({
      where: { id: parseInt(categorieId) }
    });

    if (!categorie) {
      return res.status(404).json({ error: 'Catégorie de ticket introuvable.' });
    }

    const placesRestantes = categorie.placesTotales - categorie.placesVendues;
    if (placesRestantes < quantite) {
      return res.status(400).json({ error: 'Stock insuffisant pour cette catégorie.' });
    }

      // 2. Créer le(s) ticket(s) en boucle
    const ticketsCrees = [];
    for (let i = 0; i < quantite; i++) {
      const code = 'AST-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const ticket = await prisma.ticket.create({
        data: {
          userId: String(userId), // ✅ Correction : On s'assure que c'est bien une chaîne de caractères (String)
          evenementId: parseInt(evenementId),
          categorieId: parseInt(categorieId),
          codeUnique: code,
          prixPaye: categorie.prix,
          dateAchat: new Date(),
          utilise: false
        }
      });
      ticketsCrees.push(ticket);
    }

    // 3. Mettre à jour le nombre de places vendues dans la catégorie
    await prisma.categorieTicket.update({
      where: { id: parseInt(categorieId) },
      data: { 
        placesVendues: { increment: parseInt(quantite) } 
      }
    });

    res.status(201).json({ success: true, tickets: ticketsCrees });
  } catch (error) {
    console.error("🔴 Erreur achat ticket:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;