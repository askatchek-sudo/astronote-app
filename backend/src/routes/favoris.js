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

// GET : Récupérer mes favoris
router.get('/', authUser, async (req, res) => {
  try {
    // ✅ CORRECTION ICI
    const userId = req.user.id;
    console.log("🔍 BACKEND GET - Demande des favoris pour userId:", userId);
    
    const favoris = await prisma.favori.findMany({
      where: { userId: userId },
      include: {
        morceau: { include: { artiste: true } }
      },
      orderBy: { dateAjout: 'desc' }
    });
    
    console.log("📦 BACKEND GET - Nombre de favoris trouvés en base:", favoris.length);
    
    res.json(favoris.map(f => f.morceau));
  } catch (error) {
    console.error("❌ Erreur backend GET favoris:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST : Ajouter ou Retirer un favori (Toggle)
router.post('/toggle', authUser, async (req, res) => {
  try {
    const { morceauId } = req.body;
    // ✅ CORRECTION ICI
    const userId = req.user.id;
    
    console.log("🔍 BACKEND POST - Tentative de toggle pour userId:", userId, "et morceauId:", morceauId);

    const existing = await prisma.favori.findUnique({
      where: { 
        userId_morceauId: { 
          userId, 
          morceauId: parseInt(morceauId) 
        } 
      }
    });

    if (existing) {
      console.log("⚠️ BACKEND POST - Déjà en favori, suppression en cours...");
      await prisma.favori.delete({ where: { id: existing.id } });
      res.json({ action: 'removed', message: 'Retiré des favoris' });
    } else {
      console.log("✅ BACKEND POST - Création du favori en base de données...");
      const newFav = await prisma.favori.create({ 
        data: { 
          userId, // ✅ Maintenant, cela fonctionne car userId est bien défini
          morceauId: parseInt(morceauId) 
        } 
      });
      console.log("✅ BACKEND POST - Favori créé avec succès ID:", newFav.id);
      res.json({ action: 'added', message: 'Ajouté aux favoris' });
    }
  } catch (error) {
    console.error("❌ Erreur critique backend toggle favori:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;