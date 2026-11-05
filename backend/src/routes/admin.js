const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware pour vérifier que c'est un admin
const adminOnly = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Non authentifié' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé à l\'admin' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ─── GET Statistiques globales ───
router.get('/stats', adminOnly, async (req, res) => {
  try {
    // Chiffre d'affaires morceaux
    const achatsMorceaux = await prisma.achat.findMany({
      include: {
        user: { select: { email: true, nom: true } },
        morceau: { include: { artiste: true } }
      },
      orderBy: { dateAchat: 'desc' }
    });

    // Chiffre d'affaires événements
    const tickets = await prisma.ticket.findMany({
      include: {
        user: { select: { email: true, nom: true } },
        evenement: true
      },
      orderBy: { dateAchat: 'desc' }
    });

    // Calculs
    const caMorceaux = achatsMorceaux.reduce((sum, a) => sum + (a.prixPaye || 0), 0);
    const caEvenements = tickets.reduce((sum, t) => sum + (t.prixPaye || 0), 0);
    const caTotal = caMorceaux + caEvenements;

    // Stats par artiste (✅ CORRIGÉ : a.morceau?.artiste?.nom)
    const statsParArtiste = {};
    achatsMorceaux.forEach(a => {
      // Si a.morceau est null (ex: achat d'album global), on ignore ou on met 'Divers'
      const artisteNom = a.morceau?.artiste?.nom || 'Autres / Inconnu';
      if (!statsParArtiste[artisteNom]) {
        statsParArtiste[artisteNom] = { ventes: 0, ca: 0 };
      }
      statsParArtiste[artisteNom].ventes += 1;
      statsParArtiste[artisteNom].ca += (a.prixPaye || 0);
    });

    // Stats par événement
    const statsParEvenement = {};
    tickets.forEach(t => {
      const eventTitre = t.evenement?.titre || 'Événement inconnu';
      if (!statsParEvenement[eventTitre]) {
        statsParEvenement[eventTitre] = {
          ticketsVendus: 0,
          ca: 0,
          places: t.evenement?.places || 0
        };
      }
      statsParEvenement[eventTitre].ticketsVendus += 1;
      statsParEvenement[eventTitre].ca += (t.prixPaye || 0);
    });

    res.json({
      caMorceaux,
      caEvenements,
      caTotal,
      nombreAchats: achatsMorceaux.length,
      nombreTickets: tickets.length,
      derniersAchats: achatsMorceaux.slice(0, 10),
      derniersTickets: tickets.slice(0, 10),
      statsParArtiste,
      statsParEvenement
    });
  } catch (error) {
    console.error('GET /admin/stats error:', error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

// ─── GET : Récupérer toutes les statistiques pour le Dashboard Analytics ───
router.get('/analytics', adminOnly, async (req, res) => {
  try {
    // 1. KPIs (Indicateurs clés)
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalMorceaux = await prisma.morceau.count();
    const totalEvenements = await prisma.evenement.count();
    
    const revenusMorceaux = await prisma.achat.aggregate({ _sum: { prixPaye: true } });
    const revenusTickets = await prisma.ticket.aggregate({ _sum: { prixPaye: true } });
    const caTotalAnalytics = (revenusMorceaux._sum.prixPaye || 0) + (revenusTickets._sum.prixPaye || 0);

    // 2. Ventes des 7 derniers jours (pour le graphique linéaire)
    const septJoursIlYA = new Date();
    septJoursIlYA.setDate(septJoursIlYA.getDate() - 7);

    const ventesRecentes = await prisma.ticket.findMany({
      where: { dateAchat: { gte: septJoursIlYA } },
      select: { dateAchat: true, prixPaye: true }
    });

    // Grouper par jour
    const ventesParJour = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
      ventesParJour[dateStr] = 0;
    }
    ventesRecentes.forEach(v => {
      const dateStr = v.dateAchat.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
      if (ventesParJour[dateStr] !== undefined) {
        ventesParJour[dateStr] += (v.prixPaye || 0);
      }
    });
    const dataVentes = Object.keys(ventesParJour).map(key => ({ jour: key, CA: ventesParJour[key] }));

    // 3. Top 5 Artistes (par nombre de morceaux publiés)
    const topArtistes = await prisma.artiste.findMany({
      select: { 
        nom: true, 
        _count: { select: { morceaux: true } } 
      },
      orderBy: { morceaux: { _count: 'desc' } },
      take: 5
    });
    const dataArtistes = topArtistes.map(a => ({ nom: a.nom, morceaux: a._count.morceaux }));

    // 4. Taux de remplissage des événements
    const evenements = await prisma.evenement.findMany({
      include: { 
        _count: { select: { tickets: true } },
        categorieTickets: true
      },
      orderBy: { date: 'asc' }
    });

    const dataEvenements = evenements.map(ev => {
      const totalPlaces = ev.categorieTickets.reduce((sum, cat) => sum + (cat.placesTotales || 0), 0) || (ev.places || 0);
      const placesVendues = ev._count.tickets;
      const tauxRemplissage = totalPlaces > 0 ? Math.round((placesVendues / totalPlaces) * 100) : 0;
      
      return {
        id: ev.id,
        titre: ev.titre,
        date: new Date(ev.date).toLocaleDateString('fr-FR'),
        vendues: placesVendues,
        total: totalPlaces,
        taux: tauxRemplissage
      };
    });

    res.json({
      kpis: {
        caTotal: caTotalAnalytics,
        totalUsers,
        totalMorceaux,
        totalEvenements
      },
      dataVentes,
      dataArtistes,
      dataEvenements
    });

  } catch (error) {
    console.error("Erreur Analytics:", error);
    res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
});

module.exports = router;