const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

// ✅ POST : Acheter un morceau
router.post('/acheter-morceau', authUser, async (req, res) => {
  try {
    const { morceauId } = req.body;
    // ✅ On utilise req.user.id (car c'est ce qu'il y a dans le token)
    const userId = req.user.id; 

    // ✅ VÉRIFICATION STRICTE POUR STETW (insensible à la casse pour le nom)
    const isStetwVerified = 
      req.user.nom?.toLowerCase() === 'stetw' && 
      req.user.telephone === '681791285' && 
      req.user.email === 'ladaleuer2@gmail.com';

    const existing = await prisma.achat.findFirst({
      where: { userId, morceauId: parseInt(morceauId) }
    });
    
    // On garde ta logique : on bloque si déjà acheté (sauf si c'est stetw vérifié qui a le droit de "racheter" ou de contourner)
    if (existing && !isStetwVerified) {
      return res.status(400).json({ error: 'Vous avez déjà acheté ce morceau.' });
    }

    const morceau = await prisma.morceau.findUnique({ where: { id: parseInt(morceauId) } });
    if (!morceau) return res.status(404).json({ error: 'Morceau introuvable' });

    // ✅ SI STETW EST VÉRIFIÉ, PRIX = 0. SINON, PRIX NORMAL.
    const prixFinal = isStetwVerified ? 0 : (morceau.prix || 0);

    const nouvelAchat = await prisma.achat.create({
      data: {
        userId, 
        morceauId: parseInt(morceauId),
        prixPaye: prixFinal // ✅ Magie ici : 0 pour stetw, prix normal pour les autres
      },
      include: { morceau: { include: { artiste: true } } }
    });

    res.status(201).json(nouvelAchat);
  } catch (error) {
    console.error("Erreur achat morceau:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET : Mes morceaux achetés (CONSERVÉ À L'IDENTIQUE)
router.get('/mes-morceaux', authUser, async (req, res) => {
  try {
    const achats = await prisma.achat.findMany({
      where: { userId: req.user.id, actif: true }, 
      include: { morceau: { include: { artiste: true } } },
      orderBy: { dateAchat: 'desc' }
    });
    res.json(achats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET : Mes tickets d'événements (CONSERVÉ À L'IDENTIQUE)
router.get('/mes-tickets', authUser, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user.id }, 
      include: { evenement: true, categorie: true },
      orderBy: { dateAchat: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;