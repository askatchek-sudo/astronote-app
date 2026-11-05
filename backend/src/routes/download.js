const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware d'authentification
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

// ✅ GET : Télécharger un morceau (gratuit OU déjà acheté)
router.get('/:id', authUser, async (req, res) => {
  try {
    const morceauId = parseInt(req.params.id);
    const userId = req.user.userId;

    // 1. Récupérer le morceau
    const morceau = await prisma.morceau.findUnique({
      where: { id: morceauId },
      include: { artiste: true }
    });

    if (!morceau) return res.status(404).json({ error: 'Morceau introuvable' });
    if (!morceau.audioUrl) return res.status(400).json({ error: 'Aucun fichier audio disponible' });

    // 2. Vérifier les droits d'accès
    const estGratuit = !morceau.isPayant;
    let estAchete = false;

    if (!estGratuit) {
      const achat = await prisma.achat.findFirst({
        where: { userId, morceauId, actif: true }
      });
      estAchete = !!achat;
    }

    if (!estGratuit && !estAchete) {
      return res.status(403).json({ error: 'Accès refusé : ce morceau doit être gratuit ou acheté.' });
    }

    // 3. Déterminer le chemin du fichier
    let filePath;
    if (morceau.audioUrl.startsWith('http')) {
      // Fichier externe : on redirige
      return res.redirect(morceau.audioUrl);
    } else if (morceau.audioUrl.startsWith('/uploads/')) {
      filePath = path.join(__dirname, '..', '..', morceau.audioUrl);
    } else {
      filePath = path.join(__dirname, '..', '..', 'uploads', morceau.audioUrl);
    }

    // 4. Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier audio introuvable sur le serveur' });
    }

    // 5. Envoyer le fichier avec les bons headers
    const nomArtiste = morceau.artiste?.nom || 'Artiste inconnu';
    const nomFichier = `${nomArtiste} - ${morceau.titre}${path.extname(filePath)}`;

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(nomFichier)}"`);
    res.setHeader('Content-Type', 'audio/mpeg'); // Pour les MP3
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log(`📥 Téléchargement autorisé : ${nomFichier} (User: ${userId})`);

  } catch (error) {
    console.error("Erreur téléchargement:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;