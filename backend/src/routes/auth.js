const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email OU téléphone

    // ✅ Validation des champs
    if (!identifier || !password) {
      return res.status(400).json({ 
        error: "Identifiant et mot de passe requis" 
      });
    }

    // ✅ Recherche par email OU téléphone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { telephone: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: "Identifiants incorrects" 
      });
    }

    // ✅ Vérification du mot de passe
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        error: "Identifiants incorrects" 
      });
    }

    // ✅ Génération du token (AJOUT DE 'nom' ICI)
    const token = jwt.sign(
      { 
        id: user.id, 
        nom: user.nom,          // ✅ AJOUTÉ pour la vérification frontend/backend
        email: user.email, 
        telephone: user.telephone, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        nom: user.nom, 
        email: user.email, 
        telephone: user.telephone, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;