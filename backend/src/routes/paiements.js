const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── 1. GET : Stats mensuelles pour l'onglet Ventes ───
router.get('/stats-mensuelles', async (req, res) => {
  try {
    // On récupère le mois en cours (format YYYY-MM)
    const currentMonth = new Date().toISOString().slice(0, 7);

    // On récupère tous les artistes
    const artistes = await prisma.artiste.findMany({
      select: { id: true, nom: true, telephone: true }
    });

    // On récupère tous les paiements effectués ce mois-ci
    const paiementsMois = await prisma.paiement.findMany({
      where: { mois: currentMonth },
      include: { artiste: true }
    });

    // On formate les données pour le frontend (VentesAdmin.jsx)
    const resultats = artistes.map(artiste => {
      // Trouve les paiements de cet artiste pour le mois en cours
      const paiementsArtiste = paiementsMois.filter(p => p.artisteId === artiste.id);
      const totalPaye = paiementsArtiste.reduce((sum, p) => sum + p.montant, 0);

      return {
        nom: artiste.nom,
        telephone: artiste.telephone || "Non renseigné",
        dejaPayeCeMois: totalPaye,
        estDejaPayeCeMois: totalPaye > 0 // Devient true si au moins 1 FCFA a été payé ce mois
      };
    });

    res.json(resultats);
  } catch (error) {
    console.error("Erreur stats mensuelles:", error);
    res.status(500).json({ error: "Erreur serveur lors du chargement des stats" });
  }
});

// ─── 2. POST : Enregistrer un paiement vers un artiste ───
router.post('/', async (req, res) => {
  try {
    const { artisteId, montant, mois } = req.body;

    if (!artisteId || !montant) {
      return res.status(400).json({ error: "Artiste et montant obligatoires" });
    }

    // Si aucun mois n'est passé, on prend le mois en cours
    const moisEnCours = mois || new Date().toISOString().slice(0, 7);

    const nouveauPaiement = await prisma.paiement.create({
      data: {
        artisteId: parseInt(artisteId),
        montant: parseFloat(montant),
        mois: moisEnCours
      }
    });

    res.status(201).json({ success: true, data: nouveauPaiement });
  } catch (error) {
    console.error("Erreur création paiement:", error);
    res.status(500).json({ error: "Erreur lors de l'enregistrement du paiement" });
  }
});

module.exports = router;