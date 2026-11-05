const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET tous les albums
router.get('/', async (req, res) => {
  try {
    const albums = await prisma.album.findMany({
      include: { artiste: true, morceaux: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET un album par ID
router.get('/:id', async (req, res) => {
  try {
    const album = await prisma.album.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { artiste: true, morceaux: true }
    });
    if (!album) return res.status(404).json({ error: 'Album non trouvé' });
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST créer un album
router.post('/', async (req, res) => {
  try {
    const { titre, artisteId, annee, genre, description, coverUrl, coverEmoji, isPayant, prix, dureeAcces } = req.body;

    if (!titre || !artisteId) {
      return res.status(400).json({ error: 'Titre et artisteId sont obligatoires' });
    }

    const album = await prisma.album.create({
      data: {
        titre,
        artisteId: parseInt(artisteId),
        annee: annee ? parseInt(annee) : new Date().getFullYear(),
        genre: genre || null,
        description: description || null,
        coverUrl: coverUrl || null,
        coverEmoji: coverEmoji || '💿',
        isPayant: isPayant || false,
        prix: isPayant ? parseInt(prix) : null,
        dureeAcces: isPayant ? parseInt(dureeAcces) : null
      }
    });

    res.status(201).json(album);
  } catch (error) {
    console.error('POST /albums error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT modifier un album
router.put('/:id', async (req, res) => {
  try {
    const { titre, artisteId, annee, genre, description, coverUrl, coverEmoji, isPayant, prix, dureeAcces } = req.body;

    const data = {};
    if (titre) data.titre = titre;
    if (artisteId) data.artisteId = parseInt(artisteId);
    if (annee) data.annee = parseInt(annee);
    if (genre !== undefined) data.genre = genre;
    if (description !== undefined) data.description = description;
    if (coverUrl !== undefined) data.coverUrl = coverUrl;
    if (coverEmoji !== undefined) data.coverEmoji = coverEmoji;
    
    if (isPayant !== undefined) data.isPayant = isPayant;
    if (isPayant && prix !== undefined) data.prix = parseInt(prix);
    if (isPayant && dureeAcces !== undefined) data.dureeAcces = parseInt(dureeAcces);
    if (isPayant === false) { data.prix = null; data.dureeAcces = null; }

    const album = await prisma.album.update({
      where: { id: parseInt(req.params.id) },
      data
    });

    res.json(album);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ POST : Acheter un album (FONCTIONNE MAINTENANT QUE LE SCHÉMA EST CORRIGÉ)
router.post('/acheter', async (req, res) => {
  try {
    const { albumId, userId } = req.body;

    if (!albumId || !userId) {
      return res.status(400).json({ error: 'Données manquantes pour l\'achat.' });
    }

    const album = await prisma.album.findUnique({ where: { id: parseInt(albumId) } });
    if (!album) return res.status(404).json({ error: 'Album introuvable.' });
    if (!album.isPayant) return res.status(400).json({ error: 'Cet album est gratuit.' });

    const achatExistant = await prisma.achat.findFirst({
      where: { userId: String(userId), albumId: parseInt(albumId), actif: true }
    });
    if (achatExistant) return res.status(400).json({ error: 'Vous avez déjà acheté cet album.' });

    let expiration = null;
    if (album.dureeAcces && album.dureeAcces > 0) {
      const d = new Date();
      d.setDate(d.getDate() + album.dureeAcces);
      expiration = d.toISOString();
    }

    // ✅ Création simple et propre
    const nouvelAchat = await prisma.achat.create({
      data: {
        userId: String(userId),
        albumId: parseInt(albumId),
        morceauId: null, // Explicitement null car c'est un achat d'album
        prixPaye: album.prix,
        expiration: expiration,
        actif: true
      }
    });

    res.status(201).json({ success: true, achat: nouvelAchat });
  } catch (error) {
    console.error("🔴 Erreur achat album:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE supprimer un album
router.delete('/:id', async (req, res) => {
  try {
    await prisma.album.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Album supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;