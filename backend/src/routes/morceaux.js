const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ 1. GET : Récupérer tous les morceaux
router.get('/', async (req, res) => {
  try {
    const morceaux = await prisma.morceau.findMany({
      include: {
        artiste: true,
        album: true // ✅ Important pour l'affichage frontend
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(morceaux);
  } catch (error) {
    console.error("Erreur récupération morceaux:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 2. GET : Récupérer un morceau spécifique par son ID
router.get('/:id', async (req, res) => {
  try {
    const morceau = await prisma.morceau.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { artiste: true, album: true }
    });
    if (!morceau) return res.status(404).json({ error: 'Morceau non trouvé' });
    res.json(morceau);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ 3. POST : Créer un nouveau morceau (avec vérification automatique de l'album)
router.post('/', async (req, res) => {
  try {
    const { titre, artisteId, albumId, duree, genre, annee, streams, audioUrl, isPayant, prix, dureeAcces } = req.body;

    if (!titre || !artisteId) {
      return res.status(400).json({ error: 'Titre et artisteId sont obligatoires' });
    }

    // 🛡️ SÉCURISATION : Si l'album est payant, on force le morceau à l'être aussi
    let finalIsPayant = isPayant || false;
    let finalPrix = isPayant ? parseInt(prix) : null;
    let finalDureeAcces = isPayant ? parseInt(dureeAcces) : null;

    if (albumId) {
      const album = await prisma.album.findUnique({ where: { id: parseInt(albumId) } });
      if (album && album.isPayant) {
        finalIsPayant = true;
        finalPrix = album.prix;
        finalDureeAcces = album.dureeAcces;
      }
    }

    const morceau = await prisma.morceau.create({
      data: {
        titre,
        artisteId: parseInt(artisteId),
        albumId: albumId ? parseInt(albumId) : null,
        duree: duree || null,
        genre: genre || null,
        annee: annee ? parseInt(annee) : new Date().getFullYear(),
        streams: streams ? parseInt(streams) : 0,
        audioUrl: audioUrl || null,
        isPayant: finalIsPayant,       // ✅ Valeur forcée si nécessaire
        prix: finalPrix,               // ✅ Prix de l'album
        dureeAcces: finalDureeAcces    // ✅ Durée de l'album
      },
      include: { artiste: true, album: true }
    });

    console.log(`✅ Morceau créé : ${morceau.titre} (Statut: ${morceau.isPayant ? 'Payant' : 'Gratuit'})`);
    res.status(201).json(morceau);
  } catch (error) {
    console.error("🔴 Erreur création morceau:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 4. PUT : Modifier un morceau existant (avec même vérification)
router.put('/:id', async (req, res) => {
  try {
    const { titre, artisteId, albumId, duree, genre, annee, streams, audioUrl, isPayant, prix, dureeAcces } = req.body;

    // 🛡️ SÉCURISATION : On vérifie l'album (nouveau ou actuel)
    let finalIsPayant = isPayant;
    let finalPrix = prix;
    let finalDureeAcces = dureeAcces;

    if (albumId) {
      const album = await prisma.album.findUnique({ where: { id: parseInt(albumId) } });
      if (album && album.isPayant) {
        finalIsPayant = true;
        finalPrix = album.prix;
        finalDureeAcces = album.dureeAcces;
      }
    } else if (finalIsPayant === false) {
      // Si on retire l'album et qu'on met en gratuit, on nettoie les prix
      finalPrix = null;
      finalDureeAcces = null;
    }

    // Construction propre de l'objet data pour Prisma (évite les undefined)
    const data = {};
    if (titre) data.titre = titre;
    if (artisteId) data.artisteId = parseInt(artisteId);
    if (albumId !== undefined) data.albumId = albumId ? parseInt(albumId) : null;
    if (duree !== undefined) data.duree = duree;
    if (genre !== undefined) data.genre = genre;
    if (annee) data.annee = parseInt(annee);
    if (streams !== undefined) data.streams = parseInt(streams);
    if (audioUrl !== undefined) data.audioUrl = audioUrl;
    
    // Application des règles de paiement
    data.isPayant = finalIsPayant;
    data.prix = finalIsPayant ? parseInt(finalPrix) : null;
    data.dureeAcces = finalIsPayant ? parseInt(finalDureeAcces) : null;

    const morceau = await prisma.morceau.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: { artiste: true, album: true }
    });

    console.log(`✅ Morceau modifié : ${morceau.titre} (Statut: ${morceau.isPayant ? 'Payant' : 'Gratuit'})`);
    res.json(morceau);
  } catch (error) {
    console.error("🔴 Erreur modification morceau:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 5. DELETE : Supprimer un morceau
router.delete('/:id', async (req, res) => {
  try {
    await prisma.morceau.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true, message: 'Morceau supprimé avec succès' });
  } catch (error) {
    console.error("🔴 Erreur suppression morceau:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 6. POST : Incrémenter le nombre de streams
router.post('/:id/stream', async (req, res) => {
  try {
    const morceauId = parseInt(req.params.id);
    console.log(`📈 Tentative d'incrémentation du stream pour le morceau ID: ${morceauId}`);
    
    await prisma.morceau.update({
      where: { id: morceauId },
      data: { 
        streams: { increment: 1 } 
      }
    });
    
    console.log(`✅ Stream incrémenté avec succès pour l'ID: ${morceauId}`);
    res.json({ success: true, message: 'Stream comptabilisé' });
  } catch (error) {
    console.error("🔴 Erreur increment stream:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;