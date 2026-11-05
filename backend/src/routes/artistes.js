const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET tous les artistes (avec calcul dynamique des streams)
router.get('/', async (req, res) => {
  try {
    const artistes = await prisma.artiste.findMany({
      include: {
        _count: { select: { morceaux: true } },
        morceaux: { select: { streams: true } } // On récupère les streams de chaque morceau
      },
      orderBy: { createdAt: 'desc' }
    });

    // On calcule le total dynamiquement pour chaque artiste
    const artistesAvecStats = artistes.map(a => ({
      ...a,
      tracks: a._count.morceaux,
      // Additionne tous les streams des morceaux de cet artiste (gère les valeurs nulles)
      streams: a.morceaux.reduce((total, m) => total + (m.streams || 0), 0).toString()
    }));

    res.json(artistesAvecStats);
  } catch (error) {
    console.error("Erreur GET /artistes:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET un artiste par ID (avec calcul dynamique des streams)
router.get('/:id', async (req, res) => {
  try {
    const artiste = await prisma.artiste.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { 
        morceaux: { include: { album: true } }, 
        albums: true 
      }
    });
    
    if (!artiste) return res.status(404).json({ error: 'Artiste non trouvé' });

    // Calcul dynamique des streams pour la page de détail
    const totalStreams = artiste.morceaux.reduce((total, m) => total + (m.streams || 0), 0);

    res.json({
      ...artiste,
      streams: totalStreams.toString(),
      tracks: artiste.morceaux.length
    });
  } catch (error) {
    console.error("Erreur GET /artistes/:id:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST créer un artiste (admin)
router.post('/', async (req, res) => {
  try {
    // ✅ AJOUT DE telephone DANS LA DESTRUCTURATION
    const { nom, genre, genre2, pays, bio, img, streams, tracks, telephone } = req.body;
    
    const artiste = await prisma.artiste.create({
      data: {
        nom, genre, genre2,
        pays: pays || '🇨🇮',
        bio,
        img: img || '🎵',
        streams: streams || "0",
        tracks: Number(tracks) || 0,
        telephone: telephone || null // ✅ ENREGISTREMENT DU TÉLÉPHONE
      }
    });
    res.status(201).json(artiste);
  } catch (error) {
    console.error('POST /artistes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT modifier un artiste
router.put('/:id', async (req, res) => {
  try {
    // ✅ AJOUT DE telephone DANS LA DESTRUCTURATION
    const { nom, genre, genre2, pays, bio, img, streams, tracks, telephone } = req.body;
    
    const artiste = await prisma.artiste.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        nom, genre, genre2, pays, bio, img, streams, 
        tracks: Number(tracks),
        telephone: telephone || null // ✅ MISE À JOUR DU TÉLÉPHONE
      }
    });
    res.json(artiste);
  } catch (error) {
    console.error('PUT /artistes/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE supprimer un artiste
router.delete('/:id', async (req, res) => {
  try {
    await prisma.artiste.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Artiste supprimé' });
  } catch (error) {
    console.error('DELETE /artistes/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;