const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST Envoyer un message (visiteur)
router.post('/', async (req, res) => {
  try {
    const { nom, email, sujet, message } = req.body;

    if (!nom || !email || !message) {
      return res.status(400).json({ error: 'Nom, email et message sont requis' });
    }

    const msg = await prisma.message.create({
      data: { nom, email, sujet, message }
    });

    res.status(201).json({ message: 'Message envoyé avec succès', id: msg.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Tous les messages (Admin)
router.get('/', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(messages);
  } catch (error) {
    console.error('Erreur chargement messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ PUT Marquer un message comme lu (Admin) - CORRIGÉ ICI (read au lieu de lu)
router.put('/:id/read', async (req, res) => {
  try {
    const message = await prisma.message.update({
      where: { id: parseInt(req.params.id) },
      data: { lu: true }
    });
    res.json({ success: true, message: 'Message marqué comme lu' });
  } catch (error) {
    console.error('Erreur marquage lu:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE Supprimer un message (Admin)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.message.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Message supprimé' });
  } catch (error) {
    console.error('Erreur suppression message:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;