const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST Inscription d'un utilisateur (fan)
router.post('/register', async (req, res) => {
  try {
    const { nom, email, telephone, password } = req.body;

    // ✅ Validation 1 : Au moins email OU téléphone requis
    if (!email && !telephone) {
      return res.status(400).json({ 
        error: "Veuillez fournir au moins un email ou un numéro de téléphone." 
      });
    }

    // ✅ Validation 2 : Mot de passe sécurisé (min 6 chars, 1 majuscule, 1 chiffre)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Le mot de passe doit contenir au moins 6 caractères, dont 1 majuscule et 1 chiffre." 
      });
    }

    // ✅ Vérification : Email ou téléphone déjà utilisé ?
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : null,
          telephone ? { telephone } : null
        ].filter(Boolean) // Retire les conditions null
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: "Cet email ou ce numéro de téléphone est déjà utilisé." 
      });
    }

    // ✅ Hachage du mot de passe (sécurité)
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Création de l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        nom,
        email: email || null,
        telephone: telephone || null,
        password: hashedPassword,
        role: "USER"
      }
    });

    // ✅ Génération du token JWT (AJOUT DE 'nom' ICI)
    const token = jwt.sign(
      { 
        id: newUser.id, 
        nom: newUser.nom,       // ✅ AJOUTÉ pour la vérification frontend/backend
        email: newUser.email, 
        telephone: newUser.telephone, 
        role: newUser.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      token, 
      user: { 
        id: newUser.id, 
        nom: newUser.nom, 
        email: newUser.email, 
        telephone: newUser.telephone, 
        role: newUser.role 
      } 
    });
  } catch (error) {
    console.error("Erreur register:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET Profil de l'utilisateur connecté
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Non authentifié' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ CORRECTION ICI : decoded.id (et non decoded.userId qui était une erreur)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        nom: true, 
        telephone: true, // ✅ AJOUTÉ pour être complet
        role: true, 
        avatarUrl: true 
      }
    });

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
});

module.exports = router;