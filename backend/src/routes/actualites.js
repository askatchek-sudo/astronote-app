const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET : Récupérer les actualités actives (pour le frontend)
router.get('/', async (req, res) => {
  try {
    const actualites = await prisma.actualite.findMany({
      where: { actif: true },
      orderBy: { ordre: 'asc' }
    });
    res.json(actualites);
  } catch (error) {
    console.error("Erreur GET /actualites:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET : Récupérer toutes les actualités (pour l'admin)
router.get('/admin', async (req, res) => {
  try {
    const actualites = await prisma.actualite.findMany({
      orderBy: { ordre: 'asc' }
    });
    res.json(actualites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST : Créer une actualité
router.post('/', async (req, res) => {
  try {
    const { titre, description, imageUrl, lien, ordre, actif } = req.body;
    const actualite = await prisma.actualite.create({
      data: {
        titre,
        description: description || null,
        imageUrl: imageUrl || null,
        lien: lien || null,
        ordre: Number(ordre) || 0,
        actif: actif !== false
      }
    });
    res.status(201).json(actualite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT : Modifier une actualité
router.put('/:id', async (req, res) => {
  try {
    const { titre, description, imageUrl, lien, ordre, actif } = req.body;
    const actualite = await prisma.actualite.update({
      where: { id: parseInt(req.params.id) },
      data: {
        titre,
        description: description || null,
        imageUrl: imageUrl || null,
        lien: lien || null,
        ordre: Number(ordre) || 0,
        actif: actif !== undefined ? actif : true
      }
    });
    res.json(actualite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE : Supprimer une actualité
router.delete('/:id', async (req, res) => {
  try {
    await prisma.actualite.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Actualité supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET : Classement des artistes (mensuel ou annuel selon la date)
router.get('/classement', async (req, res) => {
  try {
    const maintenant = new Date();
    const jour = maintenant.getDate();
    const mois = maintenant.getMonth(); // 0-11, décembre = 11
    const annee = maintenant.getFullYear();

    // Si on est entre le 26 et 31 décembre, classement annuel
    const estFinDecembre = mois === 11 && jour >= 26;

    let dateDebut;
    let typeClassement;

    if (estFinDecembre) {
      // Classement annuel : du 1er janvier au 31 décembre de l'année en cours
      dateDebut = new Date(annee, 0, 1);
      typeClassement = 'annuel';
    } else {
      // Classement mensuel : du 1er du mois en cours
      dateDebut = new Date(annee, mois, 1);
      typeClassement = 'mensuel';
    }

    // Récupérer tous les artistes avec leurs morceaux
    const artistes = await prisma.artiste.findMany({
      include: {
        morceaux: {
          include: {
            achats: {
              where: {
                dateAchat: { gte: dateDebut }
              }
            }
          }
        }
      }
    });

    // Calculer les streams pour chaque artiste sur la période
    const artistesAvecStreams = artistes.map(a => {
      const totalStreams = a.morceaux.reduce((total, m) => {
        return total + (m.streams || 0);
      }, 0);

      return {
        id: a.id,
        nom: a.nom,
        img: a.img,
        genre: a.genre,
        streams: totalStreams,
        nombreMorceaux: a.morceaux.length
      };
    });

    // Trier par streams décroissant et prendre le top 5
    const top5 = artistesAvecStreams
      .sort((a, b) => b.streams - a.streams)
      .slice(0, 5)
      .map((a, index) => ({ ...a, rang: index + 1 }));

    res.json({
      type: typeClassement,
      periode: estFinDecembre ? `Année ${annee}` : maintenant.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      top5
    });
  } catch (error) {
    console.error("Erreur GET /actualites/classement:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;