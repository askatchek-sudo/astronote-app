const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware pour authentifier l'utilisateur
const authUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Non authentifié' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// GET : Récupérer toutes les playlists de l'utilisateur
router.get('/', authUser, async (req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: req.user.userId },
      include: {
        morceaux: {
          include: {
            morceau: { include: { artiste: true } }
          },
          orderBy: { ordre: 'asc' }
        }
      },
      orderBy: { dateCreation: 'desc' }
    });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST : Créer une nouvelle playlist
router.post('/', authUser, async (req, res) => {
  try {
    const { nom, description, image } = req.body;
    if (!nom) return res.status(400).json({ error: 'Le nom de la playlist est requis' });

    const playlist = await prisma.playlist.create({
      data: {
        nom,
        description,
        image,
        userId: req.user.userId
      }
    });
    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE : Supprimer une playlist
router.delete('/:id', authUser, async (req, res) => {
  try {
    const playlistId = parseInt(req.params.id);
    
    // Vérifier que la playlist appartient bien à l'utilisateur
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId: req.user.userId }
    });
    if (!playlist) return res.status(404).json({ error: 'Playlist non trouvée ou accès refusé' });

    await prisma.playlist.delete({ where: { id: playlistId } });
    res.json({ message: 'Playlist supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST : Ajouter un morceau à une playlist
router.post('/:id/morceaux', authUser, async (req, res) => {
  try {
    const playlistId = parseInt(req.params.id);
    const { morceauId } = req.body;

    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, userId: req.user.userId }
    });
    if (!playlist) return res.status(404).json({ error: 'Playlist non trouvée ou accès refusé' });

    // Obtenir l'ordre actuel le plus élevé pour l'ajouter à la fin
    const dernierMorceau = await prisma.playlistMorceau.findFirst({
      where: { playlistId },
      orderBy: { ordre: 'desc' }
    });
    const nouvelOrdre = dernierMorceau ? dernierMorceau.ordre + 1 : 0;

    const ajout = await prisma.playlistMorceau.create({
      data: {
        playlistId,
        morceauId: parseInt(morceauId),
        ordre: nouvelOrdre
      },
      include: { morceau: { include: { artiste: true } } }
    });

    res.status(201).json(ajout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE : Retirer un morceau d'une playlist
router.delete('/:id/morceaux/:morceauId', authUser, async (req, res) => {
  try {
    const playlistId = parseInt(req.params.id);
    const morceauId = parseInt(req.params.morceauId);

    await prisma.playlistMorceau.delete({
      where: {
        playlistId_morceauId: { playlistId, morceauId }
      }
    });
    res.json({ message: 'Morceau retiré de la playlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;