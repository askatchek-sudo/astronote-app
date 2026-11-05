const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET : Statistiques de paiement pour tous les artistes pour le mois en cours
router.get('/stats-mensuelles', async (req, res) => {
  try {
    // Obtenir le mois en cours au format "YYYY-MM" (ex: "2023-10")
    const moisEnCours = new Date().toISOString().slice(0, 7);

    // Récupérer tous les paiements du mois en cours groupés par artiste
    const paiementsMois = await prisma.paiementArtiste.groupBy({
      by: ['artisteId'],
      where: { mois: moisEnCours, statut: 'PAYÉ' },
      _sum: { montant: true }
    });

    // Récupérer le CA total généré par chaque artiste (depuis le début)
    // Note: Idéalement, tu devrais aussi calculer le CA *de ce mois*, mais pour simplifier, 
    // on va utiliser le CA total et le comparer aux paiements.
    const artistes = await prisma.artiste.findMany({
      select: { id: true, nom: true }
    });

    // Fusionner les données pour le frontend
    const stats = artistes.map(artiste => {
      const paiement = paiementsMois.find(p => p.artisteId === artiste.id);
      return {
        artisteId: artiste.id,
        nom: artiste.nom,
        dejaPayeCeMois: paiement ? paiement._sum.montant : 0,
        estDejaPayeCeMois: paiement ? paiement._sum.montant > 0 : false
      };
    });

    res.json(stats);
  } catch (error) {
    console.error("Erreur GET /paiements/stats-mensuelles:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST : Enregistrer un nouveau paiement
router.post('/', async (req, res) => {
  try {
    const { artisteId, montant, mois } = req.body;
    
    const nouveauPaiement = await prisma.paiementArtiste.create({
      data: {
        artisteId: parseInt(artisteId),
        montant: parseFloat(montant),
        mois: mois,
        statut: 'PAYÉ'
      }
    });
    
    res.status(201).json(nouveauPaiement);
  } catch (error) {
    console.error("Erreur POST /paiements:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;