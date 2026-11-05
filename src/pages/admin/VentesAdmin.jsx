import React, { useState, useEffect } from 'react';
import { adminAPI, paiementsAPI } from '../../lib/api';

export default function VentesAdmin({ artistes, showToast }) {
  const [stats, setStats] = useState(null);
  const [statsPaiements, setStatsPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  
  const [payoutModal, setPayoutModal] = useState({ 
    open: false, 
    artisteId: null,
    artistName: "", 
    phone: "", 
    totalCA: 0, 
    dejaPaye: 0,
    percentage: 50,
    estDejaPayeCeMois: false
  });
  const [isPaying, setIsPaying] = useState(false);

  const moisEnCours = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    chargerStats();
  }, []);

  const chargerStats = async () => {
    try {
      setLoading(true);
      const [ventesData, paiementsData] = await Promise.all([
        adminAPI.getStats(),
        paiementsAPI.getStatsMensuelles()
      ]);
      setStats(ventesData);
      setStatsPaiements(paiementsData);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      showToast("Erreur de chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString('fr-FR') + ' FCFA';
  };

  // ✅ CALCUL DES TOTAUX GLOBAUX POUR L'ONGLET VUE D'ENSEMBLE
  const calculerTotauxGlobaux = () => {
    if (!stats?.statsParArtiste) return { caTotalArtistes: 0, totalDejaPaye: 0, resteTotal: 0, tousArtistesPayes: false, artistesAvecNumero: 0, artistesAvecNumeroPayes: 0 };
    
    let caTotalArtistes = 0;
    let totalDejaPaye = 0;
    let artistesAvecNumero = 0;
    let artistesAvecNumeroPayes = 0;

    Object.entries(stats.statsParArtiste).forEach(([nom, data]) => {
      caTotalArtistes += data.ca || 0;
      const paiementInfo = statsPaiements.find(p => p.nom === nom);
      
      if (paiementInfo) {
        totalDejaPaye += paiementInfo.dejaPayeCeMois || 0;
      }

      // ✅ Vérifie si l'artiste a un numéro de téléphone valide
      const artisteData = artistes.find(a => a.nom === nom);
      if (artisteData && artisteData.telephone && artisteData.telephone !== "Non renseigné" && artisteData.telephone.trim() !== "") {
        artistesAvecNumero++;
        // ✅ Vérifie si cet artiste a été payé ce mois-ci
        if (paiementInfo && paiementInfo.estDejaPayeCeMois) {
          artistesAvecNumeroPayes++;
        }
      }
    });

    const resteTotal = Math.max(0, caTotalArtistes - totalDejaPaye);
    
    // ✅ Tous les artistes avec un numéro valide ont été payés
    const tousArtistesPayes = artistesAvecNumero > 0 && artistesAvecNumero === artistesAvecNumeroPayes;

    return { caTotalArtistes, totalDejaPaye, resteTotal, tousArtistesPayes, artistesAvecNumero, artistesAvecNumeroPayes };
  };

  const { caTotalArtistes, totalDejaPaye, resteTotal, tousArtistesPayes, artistesAvecNumero, artistesAvecNumeroPayes } = calculerTotauxGlobaux();

  const openPayoutModal = (artistName) => {
    const artistData = artistes.find(a => a.nom === artistName);
    const artistStats = stats.statsParArtiste[artistName];
    const paiementInfo = statsPaiements.find(p => p.nom === artistName) || { dejaPayeCeMois: 0, estDejaPayeCeMois: false };
    
    if (artistData && artistStats) {
      const caTotal = artistStats.ca || 0;
      const dejaPaye = paiementInfo.dejaPayeCeMois || 0;

      setPayoutModal({
        open: true,
        artisteId: artistData.id,
        artistName: artistData.nom,
        phone: artistData.telephone || "Non renseigné",
        totalCA: caTotal,
        dejaPaye: dejaPaye,
        percentage: paiementInfo.estDejaPayeCeMois ? 0 : 50,
        estDejaPayeCeMois: paiementInfo.estDejaPayeCeMois
      });
    } else {
      showToast("Artiste ou données de vente introuvables.", "error");
    }
  };

  const handlePayout = async () => {
    if (!payoutModal.phone || payoutModal.phone === "Non renseigné") {
      showToast("Veuillez d'abord ajouter un numéro de téléphone à cet artiste.", "error");
      return;
    }

    if (payoutModal.estDejaPayeCeMois && payoutModal.percentage > 0) {
      if (!window.confirm("⚠️ Cet artiste a DÉJÀ été payé ce mois-ci. Voulez-vous vraiment effectuer un second paiement ?")) {
        return;
      }
    }

    setIsPaying(true);
    const montantAPayer = Math.round(payoutModal.totalCA * (payoutModal.percentage / 100));

    try {
      await paiementsAPI.create({
        artisteId: payoutModal.artisteId,
        montant: montantAPayer,
        mois: moisEnCours
      });
      
      showToast(`✅ Paiement de ${formatPrice(montantAPayer)} enregistré pour ${payoutModal.artistName} !`, "success");
      setPayoutModal({ ...payoutModal, open: false });
      chargerStats(); 
    } catch (error) {
      showToast("❌ Échec de l'enregistrement du paiement: " + error.message, "error");
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Chargement des données financières...</div>;
  }

  if (!stats) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--pink)' }}>Erreur de chargement</div>;
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 3, marginBottom: 4 }} className="glow-text">
            VENTES & REVENUS
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>
            Période actuelle : <strong>{moisEnCours}</strong>
          </div>
        </div>
        <button onClick={chargerStats} style={{
          padding: '10px 16px',
          background: 'rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.3)',
          borderRadius: 8,
          color: 'var(--cyan)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
        }}>
          🔄 Actualiser
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: '📊 Vue d\'ensemble' },
          { id: 'achats', label: '🎵 Achats Morceaux' },
          { id: 'tickets', label: ' Tickets Événements' },
          { id: 'artistes', label: '🎤 Payer les Artistes' },
          { id: 'events', label: '🎪 Par Événement' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px',
              background: tab === t.id ? 'rgba(124,58,237,0.2)' : 'transparent',
              border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8,
              color: tab === t.id ? 'var(--accent2)' : 'var(--text2)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ✅ VUE D'ENSEMBLE */}
      {tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div className="glass-card" style={{ padding: 24, textAlign: 'center', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: '#f59e0b', marginBottom: 6 }}>
                {formatPrice(stats.caTotal)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Chiffre d'affaires total
              </div>
            </div>
            <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎵</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: 'var(--cyan)', marginBottom: 6 }}>
                {formatPrice(stats.caMorceaux)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Ventes morceaux ({stats.nombreAchats})
              </div>
            </div>
            <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎟</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: 'var(--pink)', marginBottom: 6 }}>
                {formatPrice(stats.caEvenements)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Ventes tickets ({stats.nombreTickets})
              </div>
            </div>
            
            {/* ✅ CARTE RESTE À PAYER : DEVIENT VERTE SI TOUS LES ARTISTES AVEC NUMÉRO ONT ÉTÉ PAYÉS */}
            <div className="glass-card" style={{ 
              padding: 24, 
              textAlign: 'center', 
              border: tousArtistesPayes ? '2px solid rgba(0,230,118,0.5)' : '1px solid rgba(245,158,11,0.4)', 
              background: tousArtistesPayes ? 'rgba(0,230,118,0.08)' : 'rgba(245,158,11,0.05)',
              boxShadow: tousArtistesPayes ? '0 0 20px rgba(0,230,118,0.2)' : 'none',
              transition: 'all 0.4s ease'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{tousArtistesPayes ? '✅' : '⏳'}</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: tousArtistesPayes ? '#00e676' : '#f59e0b', marginBottom: 6 }}>
                {formatPrice(resteTotal)}
              </div>
              <div style={{ fontSize: 12, color: tousArtistesPayes ? '#00e676' : 'var(--text2)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: tousArtistesPayes ? 700 : 400 }}>
                {tousArtistesPayes ? '✨ Tous les artistes payés' : 'Reste à payer aux artistes'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8, opacity: 0.7 }}>
                CA: {formatPrice(caTotalArtistes)} | Payé: {formatPrice(totalDejaPaye)}
              </div>
              <div style={{ 
                fontSize: 11, 
                color: tousArtistesPayes ? '#00e676' : '#f59e0b', 
                marginTop: 6, 
                fontWeight: 700,
                padding: '4px 8px',
                background: tousArtistesPayes ? 'rgba(0,230,118,0.15)' : 'rgba(245,158,11,0.15)',
                borderRadius: 12,
                display: 'inline-block'
              }}>
                {artistesAvecNumeroPayes}/{artistesAvecNumero} artistes avec numéro payés
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 2, color: 'var(--cyan)', marginBottom: 16 }}>
                 DERNIERS ACHATS MORCEAUX
              </div>
              {stats.derniersAchats.length === 0 ? (
                <div style={{ color: 'var(--text2)', textAlign: 'center', padding: 20 }}>Aucun achat</div>
              ) : (
                stats.derniersAchats.slice(0, 5).map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.morceau?.titre || 'Morceau inconnu'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{a.user?.email || 'Utilisateur inconnu'} · {formatDate(a.dateAchat)}</div>
                    </div>
                    <div style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: 13 }}>{formatPrice(a.prixPaye)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 2, color: 'var(--pink)', marginBottom: 16 }}>
                🎟 DERNIERS TICKETS VENDUS
              </div>
              {stats.derniersTickets.length === 0 ? (
                <div style={{ color: 'var(--text2)', textAlign: 'center', padding: 20 }}>Aucun ticket</div>
              ) : (
                stats.derniersTickets.slice(0, 5).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.evenement?.titre || 'Événement inconnu'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{t.user?.email || 'Utilisateur inconnu'} · {formatDate(t.dateAchat)}</div>
                    </div>
                    <div style={{ color: 'var(--pink)', fontWeight: 700, fontSize: 13 }}>{formatPrice(t.prixPaye)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACHATS MORCEAUX (TABLEAU) */}
      {tab === 'achats' && (
        <div className="glass-card" style={{ padding: 20, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Date</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Client</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Morceau</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Artiste</th>
                <th style={{ textAlign: 'right', padding: 12, fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Prix</th>
              </tr>
            </thead>
            <tbody>
              {stats.derniersAchats.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text2)' }}>Aucun achat</td></tr>
              ) : (
                stats.derniersAchats.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 12, fontSize: 13 }}>{formatDate(a.dateAchat)}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{a.user?.nom || a.user?.email || 'Inconnu'}</td>
                    <td style={{ padding: 12, fontSize: 13, fontWeight: 600 }}>{a.morceau?.titre || 'Inconnu'}</td>
                    <td style={{ padding: 12, fontSize: 13, color: 'var(--accent2)' }}>{a.morceau?.artiste?.nom || '—'}</td>
                    <td style={{ padding: 12, fontSize: 13, textAlign: 'right', color: 'var(--cyan)', fontWeight: 700 }}>{formatPrice(a.prixPaye)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TICKETS ÉVÉNEMENTS (TABLEAU) */}
      {tab === 'tickets' && (
        <div className="glass-card" style={{ padding: 20, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Date</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Client</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Événement</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Code</th>
                <th style={{ textAlign: 'right', padding: 12, fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase' }}>Prix</th>
              </tr>
            </thead>
            <tbody>
              {stats.derniersTickets.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text2)' }}>Aucun ticket</td></tr>
              ) : (
                stats.derniersTickets.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 12, fontSize: 13 }}>{formatDate(t.dateAchat)}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{t.user?.nom || t.user?.email || 'Inconnu'}</td>
                    <td style={{ padding: 12, fontSize: 13, fontWeight: 600 }}>{t.evenement?.titre || 'Inconnu'}</td>
                    <td style={{ padding: 12, fontSize: 11, fontFamily: "'Space Mono',monospace", color: 'var(--pink)' }}>{t.codeUnique || '—'}</td>
                    <td style={{ padding: 12, fontSize: 13, textAlign: 'right', color: 'var(--pink)', fontWeight: 700 }}>{formatPrice(t.prixPaye)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ONGLET ARTISTES */}
      {tab === 'artistes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {Object.keys(stats.statsParArtiste || {}).length === 0 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text2)', gridColumn: '1 / -1' }}>Aucune vente d'artiste</div>
          ) : (
            Object.entries(stats.statsParArtiste || {}).map(([nom, data]) => {
              const paiementInfo = statsPaiements.find(p => p.nom === nom) || { dejaPayeCeMois: 0, estDejaPayeCeMois: false };
              const caTotal = data.ca || 0;
              const dejaPaye = paiementInfo.dejaPayeCeMois || 0;
              const resteAPayer = Math.max(0, caTotal - dejaPaye);

              return (
                <div key={nom} className="glass-card" style={{ padding: 24, position: 'relative', border: paiementInfo.estDejaPayeCeMois ? '1px solid rgba(0, 230, 118, 0.4)' : '1px solid var(--border)' }}>
                  {paiementInfo.estDejaPayeCeMois && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0, 230, 118, 0.15)', color: '#00e676', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1px solid rgba(0, 230, 118, 0.3)' }}>
                      ✅ Payé ce mois
                    </div>
                  )}
                  
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, fontFamily: "'Orbitron',sans-serif", paddingRight: paiementInfo.estDejaPayeCeMois ? 80 : 0 }}>{nom}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text2)' }}>CA Total Généré</span>
                      <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{formatPrice(caTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text2)' }}>Déjà payé (ce mois)</span>
                      <span style={{ color: '#00e676', fontWeight: 700 }}>- {formatPrice(dejaPaye)}</span>
                    </div>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                      <span style={{ color: 'var(--text)', fontWeight: 600 }}>Reste </span>
                      <span style={{ color: '#f59e0b', fontWeight: 900 }}>{formatPrice(resteAPayer)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => openPayoutModal(nom)}
                    disabled={resteAPayer <= 0 && paiementInfo.estDejaPayeCeMois}
                    style={{ 
                      width: '100%', padding: '12px', 
                      background: (resteAPayer <= 0 && paiementInfo.estDejaPayeCeMois) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--accent), var(--cyan))', 
                      border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, 
                      cursor: (resteAPayer <= 0 && paiementInfo.estDejaPayeCeMois) ? 'not-allowed' : 'pointer', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: (resteAPayer <= 0 && paiementInfo.estDejaPayeCeMois) ? 0.5 : 1
                    }}
                  >
                    💸 {paiementInfo.estDejaPayeCeMois ? 'Payer à nouveau' : 'Effectuer le paiement'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* PAR ÉVÉNEMENT */}
      {tab === 'events' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {Object.keys(stats.statsParEvenement || {}).length === 0 ? (
            <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Aucun ticket vendu</div>
          ) : (
            Object.entries(stats.statsParEvenement || {}).map(([titre, data]) => {
              const tauxRemplissage = data.places > 0 ? Math.round((data.ticketsVendus / data.places) * 100) : 0;
              return (
                <div key={titre} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, fontFamily: "'Orbitron',sans-serif" }}>{titre}</div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text2)' }}>Taux de remplissage</span>
                      <span style={{ color: 'var(--pink)', fontWeight: 700 }}>{tauxRemplissage}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${tauxRemplissage}%`, height: '100%', background: 'linear-gradient(90deg,var(--pink),var(--accent))' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text2)', fontSize: 13 }}>Tickets vendus</span>
                    <span style={{ color: 'var(--pink)', fontWeight: 700 }}>{data.ticketsVendus || 0} / {data.places || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text2)', fontSize: 13 }}>CA</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{formatPrice(data.ca || 0)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODALE DE PAIEMENT */}
      {payoutModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 480, padding: 32, position: 'relative' }}>
            <button onClick={() => setPayoutModal({ ...payoutModal, open: false })} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text2)', fontSize: 24, cursor: 'pointer' }}>✕</button>
            
            <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, marginBottom: 24, color: 'var(--accent2)' }}>💸 Paiement Artiste</h3>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Artiste</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{payoutModal.artistName}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Mobile Money</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan)' }}>📞 {payoutModal.phone}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>CA Total</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)' }}>{formatPrice(payoutModal.totalCA)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Déjà payé</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#00e676' }}>{formatPrice(payoutModal.dejaPaye)}</div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                <span>Pourcentage à reverser</span>
                <span style={{ color: 'var(--accent2)', fontWeight: 700 }}>{payoutModal.percentage}%</span>
              </label>
              <input 
                type="range" min="0" max="100" step="5"
                value={payoutModal.percentage} 
                onChange={(e) => setPayoutModal({...payoutModal, percentage: Number(e.target.value)})}
                style={{ width: '100%', accentColor: 'var(--cyan)' }}
              />
            </div>

            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: 16, marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Montant à envoyer</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#f59e0b', fontFamily: "'Orbitron',sans-serif" }}>
                {formatPrice(Math.round(payoutModal.totalCA * (payoutModal.percentage / 100)))}
              </div>
            </div>

            <button 
              onClick={handlePayout} 
              disabled={isPaying || payoutModal.phone === "Non renseigné"}
              style={{ width: '100%', padding: '16px', background: isPaying ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #00e676, #00c853)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 700, cursor: isPaying ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {isPaying ? ' Enregistrement...' : '✅ Confirmer et Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}