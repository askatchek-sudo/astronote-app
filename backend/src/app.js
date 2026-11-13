require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

// ─── 🔍 DIAGNOSTIC VARIABLES (pour les logs Fly.io) ───
const requiredVars = ['DATABASE_URL','JWT_SECRET','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET','CAMERPAY_API_TOKEN','CAMERPAY_HMAC_SECRET'];
const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length) {
  console.warn('⚠️ VARIABLES MANQUANTES:', missing.join(', '));
} else {
  console.log('✅ Toutes les variables critiques sont présentes');
}
console.log(`🔌 Le serveur va écouter sur 0.0.0.0:${PORT}`);

// ─── MIDDLEWARE ───
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers uploadés localement
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── ROUTES ───
app.use('/api/auth', require('./routes/auth'));
app.use('/api/artistes', require('./routes/artistes'));
app.use('/api/morceaux', require('./routes/morceaux'));
app.use('/api/albums', require('./routes/albums'));
app.use('/api/evenements', require('./routes/evenements'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/achats', require('./routes/achats'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/favoris', require('./routes/favoris'));
app.use('/api/download', require('./routes/download'));
app.use('/api/actualites', require('./routes/actualites'));
app.use('/api/paiement', require('./routes/paiement'));

// ✅ Route racine (pour tester + éviter les 404 sur "/")
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'ASTRONOTE API is alive 🚀' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ASTRONOTE API is running 🚀' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ─── ROUTES SPÉCIFIQUES ───

// Route pour supprimer une catégorie de ticket
app.delete('/api/categorieTickets/:id', async (req, res) => {
  try {
    const categorieId = parseInt(req.params.id);
    const ticketsAssocies = await prisma.ticket.count({ where: { categorieId } });
    if (ticketsAssocies > 0) {
      return res.status(400).json({ error: "Impossible de supprimer : des tickets ont déjà été vendus pour cette catégorie." });
    }
    await prisma.categorieTicket.delete({ where: { id: categorieId } });
    res.json({ success: true, message: "Catégorie supprimée avec succès." });
  } catch (error) {
    console.error("Erreur suppression catégorie:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour acheter des tickets (avec catégorie et quantité)
app.post('/api/tickets/acheter', async (req, res) => {
  try {
    const { userId, evenementId, categorieId, quantite } = req.body;
    const qte = parseInt(quantite) || 1;

    const categorie = await prisma.categorieTicket.findUnique({
      where: { id: parseInt(categorieId) },
      include: { evenement: true }
    });

    if (!categorie) return res.status(404).json({ error: "Catégorie introuvable" });
    
    const placesRestantes = categorie.placesTotales - categorie.placesVendues;
    if (placesRestantes < qte) {
      return res.status(400).json({ error: "Pas assez de places disponibles" });
    }

    const ticketsData = [];
    const transactionId = `TXN-${Date.now()}`;
    
    for (let i = 0; i < qte; i++) {
      ticketsData.push({
        codeUnique: `ASTRO-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        prixPaye: categorie.prix,
        userId: userId,
        evenementId: categorie.evenementId,
        categorieId: categorie.id,
        transactionId: transactionId
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.ticket.createMany({ data: ticketsData });
      await tx.categorieTicket.update({
        where: { id: categorie.id },
        data: { placesVendues: { increment: qte } }
      });
      return await tx.ticket.findMany({
        where: { transactionId },
        include: { evenement: true, categorie: true }
      });
    });

    res.status(201).json({ success: true, tickets: result, transactionId });
  } catch (error) {
    console.error("Erreur achat tickets:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─── DÉMARRAGE DU SERVEUR (0.0.0.0 + 8080 pour Fly.io) ───
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ASTRONOTE API running on http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV || 'development'}`);
});