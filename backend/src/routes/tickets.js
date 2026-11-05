// ─── POST : Vérifier / Scanner un ticket ───
router.post('/verifier', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        valide: false, 
        message: "Code manquant" 
      });
    }

    // 1. Chercher le ticket
    const ticket = await prisma.ticket.findUnique({
      where: { codeUnique: code.trim() },
      include: { 
        evenement: true, 
        categorie: true,
        user: { select: { nom: true, email: true } }
      }
    });

    if (!ticket) {
      return res.json({ 
        valide: false, 
        message: "❌ Ticket introuvable",
        type: "not_found"
      });
    }

    // 2. Vérifier si déjà utilisé
    if (ticket.utilise) {
      return res.json({ 
        valide: false, 
        message: `⚠️ Ticket DÉJÀ UTILISÉ le ${new Date(ticket.dateUtilisation).toLocaleString('fr-FR')}`,
        type: "already_used",
        ticket: {
          code: ticket.codeUnique,
          evenement: ticket.evenement.titre,
          categorie: ticket.categorie?.nom,
          acheteur: ticket.user?.nom || ticket.user?.email
        }
      });
    }

    // 3. Marquer comme utilisé
    const ticketMisAJour = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { 
        utilise: true, 
        dateUtilisation: new Date() 
      },
      include: { 
        evenement: true, 
        categorie: true,
        user: { select: { nom: true, email: true } }
      }
    });

    res.json({ 
      valide: true, 
      message: "✅ Ticket valide - Bienvenue !",
      type: "valid",
      ticket: {
        code: ticketMisAJour.codeUnique,
        evenement: ticketMisAJour.evenement.titre,
        categorie: ticketMisAJour.categorie?.nom,
        acheteur: ticketMisAJour.user?.nom || ticketMisAJour.user?.email,
        dateValidation: new Date().toLocaleString('fr-FR')
      }
    });
  } catch (error) {
    console.error("Erreur vérification ticket:", error);
    res.status(500).json({ valide: false, message: "Erreur serveur" });
  }
});

// ─── GET : Statistiques de scan d'un événement ───
router.get('/:id/stats-scan', async (req, res) => {
  try {
    const evenementId = parseInt(req.params.id);
    
    const stats = await prisma.ticket.groupBy({
      by: ['categorieId', 'utilise'],
      where: { evenementId },
      _count: true
    });

    const totalTickets = await prisma.ticket.count({ where: { evenementId } });
    const totalScannes = await prisma.ticket.count({ where: { evenementId, utilise: true } });

    res.json({ stats, totalTickets, totalScannes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});