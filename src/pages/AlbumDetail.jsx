import { useState, useEffect } from "react";
import { achatsAPI, morceauxAPI, albumsAPI, paiementAPI } from "../lib/api";
import AuthModal from "../components/AuthModal";
import BoutonPartage from '../components/BoutonPartage';
import BoutonFavori from '../components/BoutonFavori';
import { DownloadIcon, ShareIcon } from '../components/Icons';
import AudioVisualizer from '../components/AudioVisualizer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ✅ SYSTÈME DE PALIERS DE STREAMS (Réutilisable pour Morceaux ET Albums)
const getStreamBadge = (streams) => {
  const s = Number(streams) || 0;
  
  if (s >= 10000000) return { emoji: '💎', label: 'Diamant', color: '#b9f2ff', bg: 'rgba(185, 242, 255, 0.1)', border: 'rgba(185, 242, 255, 0.3)' };
  if (s >= 1000000)  return { emoji: '🥇', label: 'Or',       color: '#ffd700', bg: 'rgba(255, 215, 0, 0.1)',   border: 'rgba(255, 215, 0, 0.3)' };
  if (s >= 100000)   return { emoji: '🥈', label: 'Argent',   color: '#c0c0c0', bg: 'rgba(192, 192, 192, 0.1)', border: 'rgba(192, 192, 192, 0.3)' };
  if (s >= 10000)    return { emoji: '🥉', label: 'Bronze',   color: '#cd7f32', bg: 'rgba(205, 127, 50, 0.1)',  border: 'rgba(205, 127, 50, 0.3)' };
  if (s >= 1000)     return { emoji: '⭐', label: 'Étoile',   color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)', border: 'rgba(167, 139, 250, 0.3)' };
  
  return null;
};

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/uploads/")) return `${API_URL}${img}`;
  if (img.includes("/uploads/")) return `${API_URL}/${img.replace(/^\//, "")}`;
  return null;
};

const AlbumDetail = ({ albumId, artistes, morceaux, albums, setMorceauEnCours, morceauEnCours, setPage, setAlbumSelectionne, currentUser }) => {
  const album = albums.find(a => String(a.id) === String(albumId));
  
  const [showLogin, setShowLogin] = useState(false);
  const [morceauEnAttente, setMorceauEnAttente] = useState(null);
  const [mesAchats, setMesAchats] = useState([]);
  const [telechargementEnCours, setTelechargementEnCours] = useState(null);
  
  // ✅ ÉTATS POUR LA PROTECTION ANTI-DOUBLE-CLIC
  const [achatAlbumEnCours, setAchatAlbumEnCours] = useState(false);
  const [achatMorceauEnCours, setAchatMorceauEnCours] = useState(null);

  const userActuel = currentUser || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null);
  const isStetwVerified = 
    userActuel?.nom?.toLowerCase() === 'stetw' && 
    userActuel?.telephone === '681791285' && 
    userActuel?.email === 'ladaleuer2@gmail.com';

  useEffect(() => {
    if (currentUser) {
      achatsAPI.mesMorceaux().then(data => setMesAchats(data)).catch(console.error);
    } else { setMesAchats([]); }
  }, [currentUser]);

  if (!album) {
    return (
      <div style={{ padding: "120px 20px 80px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>💿</div>
        <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, marginBottom: 16 }}>Album introuvable</h1>
        <button className="btn-outline" onClick={() => setPage("accueil")} style={{ marginTop: 20 }}>← Retour à l'accueil</button>
      </div>
    );
  }

  const artiste = artistes.find(a => a.id === Number(album.artisteId));
  const morceauxAlbum = morceaux.filter(m => String(m.albumId) === String(album.id));

  // ✅ CALCUL DU TOTAL DES STREAMS DE L'ALBUM POUR LE BADGE GLOBAL
  const totalStreamsAlbum = morceauxAlbum.reduce((sum, m) => sum + (Number(m.streams) || 0), 0);
  const albumBadge = getStreamBadge(totalStreamsAlbum);

  const maintenant = new Date();
  const estPayant = (m) => !m.isPayant ? false : (!m.expiration ? true : new Date(m.expiration) > maintenant);
  const estDejaAchete = (morceauId) => mesAchats.some(a => a.morceauId === morceauId || (a.morceau && a.morceau.id === morceauId));
  const estAlbumAchete = mesAchats.some(a => String(a.albumId) === String(album.id) && a.actif);

  const handleTelecharger = async (m) => {
    if (!currentUser) { setMorceauEnAttente({ ...m, action: 'telecharger' }); setShowLogin(true); return; }
    if (!m.audioUrl) return;
    setTelechargementEnCours(m.id);
    try { await morceauxAPI.telecharger(m.id); } 
    catch (error) { alert("❌ " + error.message); } 
    finally { setTelechargementEnCours(null); }
  };

  // ✅ 1. ACHAT DE L'ALBUM ENTIER (Avec anti-double-clic)
  const executerAchatAlbum = async () => {
    if (achatAlbumEnCours) return;
    if (!currentUser) { setShowLogin(true); return; }
    
    setAchatAlbumEnCours(true);
    try {
      const userActuel = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      if (!userActuel || !userActuel.id) throw new Error("Utilisateur non identifié.");

      if (isStetwVerified) {
        await albumsAPI.acheterAlbum({ albumId: album.id, userId: userActuel.id });
        setMesAchats(await achatsAPI.mesMorceaux());
        alert("✅ Album obtenu gratuitement ! Tous les titres sont débloqués.");
        setAchatAlbumEnCours(false);
        return;
      }

      const reponsePaiement = await paiementAPI.initier({
        userId: userActuel.id, type: 'album', itemId: album.id, montant: album.prix,
        description: `Achat de l'album "${album.titre}"`,
        customerName: userActuel.nom || 'Client', customerEmail: userActuel.email || 'client@astronote.com',
        customerPhone: userActuel.telephone || '600000000'
      });
      
      if (reponsePaiement.success && reponsePaiement.paymentUrl) {
        const popup = window.open(reponsePaiement.paymentUrl, 'Paiement', 'width=450,height=700,left='+(window.screen.width-450)/2+',top='+(window.screen.height-700)/2);
        setTimeout(() => setAchatAlbumEnCours(false), 1000);
        
        const verifier = setInterval(() => {
          if (popup.closed) {
            clearInterval(verifier);
            setAchatAlbumEnCours(false);
            achatsAPI.mesMorceaux().then(setMesAchats).then(() => setPage('merci')).catch(() => setPage('merci'));
          }
        }, 2000);
      } else {
        throw new Error("Impossible d'initialiser le paiement.");
      }
    } catch (error) {
      alert("❌ Erreur : " + (error.message || "Impossible de réaliser l'achat."));
      setAchatAlbumEnCours(false);
    }
  };

  // ✅ 2. ACHAT D'UN TITRE À L'UNITÉ
  const handleAchatMorceau = async (m) => {
    if (achatMorceauEnCours === m.id) return;
    if (!currentUser) { setMorceauEnAttente({ ...m, action: 'acheter' }); setShowLogin(true); return; }

    setAchatMorceauEnCours(m.id);
    try {
      const userActuel = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      const reponsePaiement = await paiementAPI.initier({
        userId: userActuel.id, type: 'morceau', itemId: m.id, montant: m.prix || 100,
        description: `Achat du morceau "${m.titre}"`,
        customerName: userActuel.nom || 'Client', customerEmail: userActuel.email || 'client@astronote.com',
        customerPhone: userActuel.telephone || '600000000'
      });

      if (reponsePaiement.success && reponsePaiement.paymentUrl) {
        const popup = window.open(reponsePaiement.paymentUrl, 'Paiement', 'width=450,height=700,left='+(window.screen.width-450)/2+',top='+(window.screen.height-700)/2);
        setTimeout(() => setAchatMorceauEnCours(null), 1000);

        const verifier = setInterval(() => {
          if (popup.closed) {
            clearInterval(verifier);
            setAchatMorceauEnCours(null);
            achatsAPI.mesMorceaux().then(nouveauxAchats => {
              setMesAchats(nouveauxAchats);
              if (nouveauxAchats.some(a => a.morceauId === m.id || (a.morceau && a.morceau.id === m.id))) {
                lancerLectureAlbum(m, morceauxAlbum);
              }
            }).catch(err => console.error("Erreur rafraîchissement achats:", err));
          }
        }, 2000);
      } else {
        throw new Error("Impossible d'initialiser le paiement.");
      }
    } catch (error) {
      alert("❌ Erreur : " + (error.message || "Impossible de réaliser l'achat."));
      setAchatMorceauEnCours(null);
    }
  }; 

  const construireFile = (source) => source.map(track => ({
    ...track,
    audioUrl: track.audioUrl?.startsWith('http') ? track.audioUrl : `${API_URL}${track.audioUrl}`
  }));

  const lancerLectureAlbum = (m, sourceListe) => {
    if (!m || !m.audioUrl) return;
    const listeAccessible = sourceListe.filter(track => {
      const payant = estPayant(track);
      const achete = estDejaAchete(track.id);
      return !payant || achete || estAlbumAchete;
    });
    const fileLecture = construireFile(listeAccessible);
    const indexActuel = fileLecture.findIndex(track => track.id === m.id);
    
    if (indexActuel === -1) {
      setMorceauEnCours({ ...m, audioUrl: m.audioUrl.startsWith('http') ? m.audioUrl : `${API_URL}${m.audioUrl}`, playlist: null });
      return;
    }
    setMorceauEnCours({ 
      ...fileLecture[indexActuel], 
      playlist: { nom: `Album: ${album.titre}`, file: fileLecture, indexActuel, shuffle: false } 
    });
  };

  const handlePlayClick = (m) => {
    if (!currentUser) {
      setMorceauEnAttente({ morceau: m, action: 'ecouter' });
      setShowLogin(true);
      return;
    }
    lancerLectureAlbum(m, morceauxAlbum);
  };

  const handleLoginSuccess = (user) => {
    setShowLogin(false);
    window.dispatchEvent(new CustomEvent("fan-connected", { detail: user }));
    localStorage.setItem('user-version', Date.now().toString());
    if (morceauEnAttente) {
      const { morceau, action } = morceauEnAttente;
      setMorceauEnAttente(null);
      if (action === 'telecharger') handleTelecharger(morceau);
      else if (action === 'acheter') handleAchatMorceau(morceau);
      else if (action === 'ecouter') lancerLectureAlbum(morceau, morceauxAlbum);
    }
  };

  const coverUrl = getImageUrl(album.coverUrl);
  const isImageUrl = coverUrl !== null;

  const iconButtonStyle = (color, bgColor, borderColor, size = 36) => ({
    width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    background: bgColor, border: `1px solid ${borderColor}`, color: color, cursor: "pointer", transition: "all 0.2s", flexShrink: 0, fontSize: size === 32 ? 14 : 16
  });

  return (
    <>
      <style>{`
        .responsive-page { padding: 100px 16px 60px !important; }
        .responsive-header-grid { grid-template-columns: 1fr !important; text-align: center !important; min-height: auto !important; }
        .responsive-header-img { width: 220px !important; height: 220px !important; margin: 0 auto 24px auto !important; border-radius: 12px !important; box-shadow: 0 12px 32px rgba(0,0,0,0.4) !important; }
        .responsive-img-overlay { background: linear-gradient(0deg, rgba(8,11,24,0.9) 0%, transparent 50%) !important; }
        .responsive-list-item { padding: 12px 16px !important; }
        .responsive-banner { flex-direction: column; text-align: center; }
        
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        @media (min-width: 768px) {
          .responsive-page { padding: 120px 40px 80px !important; }
          .responsive-header-grid { grid-template-columns: 280px 1fr !important; text-align: left !important; min-height: 280px !important; }
          .responsive-header-img { width: 100% !important; height: 100% !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
          .responsive-img-overlay { background: linear-gradient(90deg, transparent 50%, rgba(8,11,24,0.9) 100%) !important; }
          .responsive-list-item { padding: 12px 24px !important; }
          .responsive-banner { flex-direction: row; text-align: left; }
        }
      `}</style>

      <div className="responsive-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <button onClick={() => setPage("accueil")} style={{ marginBottom: 24, padding: "8px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 50, color: "var(--text2)", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>← Retour</button>

        <div className="glass-card" style={{ overflow: "hidden", marginBottom: 32, animation: "fadeUp 0.6s ease both" }}>
          <div className="responsive-header-grid" style={{ display: "grid", gap: 0 }}>
            <div className="responsive-header-img" style={{ background: isImageUrl ? "#1a1a2e" : "linear-gradient(135deg,var(--accent),var(--pink))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              {isImageUrl ? (
                <img src={coverUrl} alt={album.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 80, lineHeight: 1 }}>{album.coverEmoji || "💿"}</span>
              )}
              <div className="responsive-img-overlay" style={{ position: "absolute", inset: 0 }} />
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Album ASTRONOTE</div>
              <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, letterSpacing: 2, marginBottom: 12, lineHeight: 1.1 }} className="glow-text">{album.titre}</h1>
              
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, fontSize: 14, justifyContent: "center" }}>
                {artiste && (
                  <span style={{ padding: "6px 14px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 50, color: "var(--accent2)", fontWeight: 600, cursor: "pointer" }} onClick={() => { window.dispatchEvent(new CustomEvent("artiste-selected", { detail: artiste.id })); setPage("artiste-detail"); }}>
                     {artiste.nom}
                  </span>
                )}
                {album.annee && <span style={{ padding: "6px 14px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 50, color: "var(--cyan)", fontWeight: 600 }}>📅 {album.annee}</span>}
                {album.genre && <span style={{ padding: "6px 14px", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: 50, color: "var(--vert)", fontWeight: 600 }}>🎵 {album.genre}</span>}
              </div>

              {/* ✅ BANNIÈRE D'ACHAT ALBUM */}
              {album.isPayant && !estAlbumAchete && (
                <div className="responsive-banner" style={{ marginBottom: 20, padding: 16, background: isStetwVerified ? "rgba(0,230,118,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${isStetwVerified ? "rgba(0,230,118,0.3)" : "rgba(245,158,11,0.3)"}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: isStetwVerified ? "#00e676" : "#f59e0b", fontWeight: 700, letterSpacing: 1 }}>{isStetwVerified ? "OFFRE SPÉCIALE VIP" : "ALBUM PAYANT"}</div>
                    <div style={{ fontSize: 24, fontFamily: "'Orbitron',sans-serif", fontWeight: 900, color: isStetwVerified ? "#00e676" : "#fff" }}>{isStetwVerified ? "GRATUIT 🎁" : `${album.prix} FCFA`}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>Débloque tous les titres d'un coup</div>
                  </div>
                  <button 
                    onClick={executerAchatAlbum} 
                    disabled={achatAlbumEnCours} 
                    style={{ 
                      padding: "12px 24px", background: achatAlbumEnCours ? "rgba(255,255,255,0.1)" : (isStetwVerified ? "linear-gradient(135deg, #00e676, #00c853)" : "linear-gradient(135deg, #f59e0b, #d97706)"), 
                      border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: achatAlbumEnCours ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8, justifyContent: "center", opacity: achatAlbumEnCours ? 0.6 : 1, minWidth: 160
                    }}
                  >
                    {achatAlbumEnCours ? (
                      <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Traitement...</>
                    ) : (isStetwVerified ? "🎁 Obtenir gratuitement" : "🛒 Acheter l'album")}
                  </button>
                </div>
              )}
              
              {estAlbumAchete && (
                <div style={{ marginBottom: 20, padding: 12, background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#00e676", fontWeight: 700, fontSize: 14 }}>
                  ✅ Vous possédez cet album. Tous les titres sont débloqués.
                </div>
              )}

              {album.description && <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginBottom: 24, textAlign: "center" }}>{album.description}</p>}
              
              {/* ✅ STATS GLOBALES AVEC BADGE D'ALBUM */}
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--cyan)" }}>{morceauxAlbum.length}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase" }}>Titres</div>
                </div>
                
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--accent2)" }}>
                    {totalStreamsAlbum.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Streams</div>
                  
                  {/* ✅ NOUVEAU : Badge global de l'album basé sur le total cumulé */}
                  {albumBadge && (
                    <span style={{ 
                      padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: albumBadge.bg, border: `1px solid ${albumBadge.border}`, color: albumBadge.color,
                      display: "inline-flex", alignItems: "center", gap: 4
                    }}>
                      {albumBadge.emoji} Album {albumBadge.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 2, marginBottom: 20, color: "var(--accent2)", textAlign: "center" }}>🎵 Liste des titres</h3>

        <div className="glass-card" style={{ overflow: "hidden" }}>
          {morceauxAlbum.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "var(--text2)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
              <div>Aucun morceau disponible pour cet album.</div>
            </div>
          ) : (
            morceauxAlbum.map((m, i) => {
              const estBloqueParAlbum = album.isPayant && !estAlbumAchete;
              const estBloqueParMorceau = estPayant(m) && !estDejaAchete(m.id);
              const estBloque = estBloqueParAlbum || estBloqueParMorceau;
              const peutInteragir = !estBloque;
              
              const estEnCours = morceauEnCours && String(morceauEnCours.id) === String(m.id);
              const badge = getStreamBadge(m.streams); // ✅ Badge individuel du morceau

              return (
                <div 
                  key={m.id} 
                  className="responsive-list-item"
                  style={{ 
                    display: "flex", alignItems: "center", gap: 12, 
                    borderBottom: i < morceauxAlbum.length - 1 ? "1px solid var(--border)" : "none", 
                    background: estEnCours ? "rgba(6, 182, 212, 0.1)" : "transparent",
                    borderLeft: estEnCours ? "3px solid var(--cyan)" : "3px solid transparent",
                    transition: "all 0.2s", 
                    opacity: estBloque ? 0.6 : 1 
                  }}
                >
                  <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    {estEnCours ? <AudioVisualizer key={`viz-${m.id}`} isPlaying={true} color="var(--cyan)" /> : <div style={{ textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 14, color: "var(--text2)", fontWeight: 400 }}>{i + 1}</div>}
                  </div>

                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,var(--accent),var(--cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎵</div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: estEnCours ? "var(--cyan)" : (peutInteragir ? "var(--text)" : "var(--text2)") }}>{m.titre}</div>
                      <span style={{ 
                        padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, flexShrink: 0, 
                        background: estBloque ? "rgba(245,158,11,0.15)" : "rgba(0,230,118,0.1)", 
                        border: `1px solid ${estBloque ? "rgba(245,158,11,0.4)" : "rgba(0,230,118,0.3)"}`, 
                        color: estBloque ? "#f59e0b" : "var(--vert)" 
                      }}>
                        {estBloqueParAlbum ? "🔒 Album" : (estBloqueParMorceau ? `🔒 ${m.prix ? m.prix + ' F' : 'Payant'}` : "🎧 Disponible")}
                      </span>
                    </div>
                    
                    {/* ✅ AFFICHAGE DES STREAMS INDIVIDUELS + BADGE INDIVIDUEL */}
                    <div style={{ fontSize: 12, color: estEnCours ? "var(--cyan)" : "var(--text2)", marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {m.annee && <span>{m.annee} · </span>}
                      {m.streams && <span>{m.streams} streams</span>}
                      
                      {badge && (
                        <span style={{ 
                          padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          display: "inline-flex", alignItems: "center", gap: 4
                        }}>
                          {badge.emoji} {badge.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative', zIndex: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {peutInteragir ? (
                      <>
                        <BoutonFavori morceauId={m.id} currentUser={currentUser} onOpenLogin={() => { setMorceauEnAttente({ morceau: m, action: 'partager' }); setShowLogin(true); }} />
                        {m.audioUrl && (
                          <button onClick={() => handleTelecharger(m)} disabled={telechargementEnCours === m.id} style={{ ...iconButtonStyle(telechargementEnCours === m.id ? "var(--text2)" : "var(--vert)", telechargementEnCours === m.id ? "rgba(255,255,255,0.05)" : "rgba(0,230,118,0.1)", telechargementEnCours === m.id ? "var(--border)" : "rgba(0,230,118,0.3)"), cursor: telechargementEnCours === m.id ? "wait" : "pointer" }} title="Télécharger">
                            {telechargementEnCours === m.id ? <span style={{ fontSize: 14 }}>⏳</span> : <DownloadIcon size={16} />}
                          </button>
                        )}
                        <BoutonPartage titre={m.titre} texte={`🎵 Écoute "${m.titre}" sur ASTRONOTE !`} url={`${window.location.origin}/album/${album.id}?morceau=${m.id}`} type="morceau" currentUser={currentUser} onOpenLogin={() => { setMorceauEnAttente({ morceau: m, action: 'partager' }); setShowLogin(true); }} icon={<ShareIcon size={16} />} />
                        
                        {m.audioUrl ? (
                          <button onClick={() => handlePlayClick(m)} style={{ ...iconButtonStyle(estEnCours ? "#fff" : "var(--cyan)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.1)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.3)"), width: 40, height: 40, fontSize: 18 }} title="Écouter">
                            {estEnCours ? "⏸" : "▶"}
                          </button>
                        ) : <span style={{ fontSize: 12, color: "var(--text2)", opacity: 0.5, width: 40, textAlign: "center" }}>—</span>}
                      </>
                    ) : (
                      estBloqueParAlbum ? (
                        <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)", opacity: 0.5, cursor: "not-allowed" }} title="Achetez l'album pour débloquer ce titre">🔒</div>
                      ) : (
                        <button 
                          onClick={() => handleAchatMorceau(m)}
                          disabled={achatMorceauEnCours === m.id}
                          style={{ 
                            padding: "8px 12px", background: achatMorceauEnCours === m.id ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.1))", 
                            border: "1px solid rgba(245,158,11,0.4)", borderRadius: 20, color: "#f59e0b", fontSize: 11, 
                            cursor: achatMorceauEnCours === m.id ? "wait" : "pointer", fontWeight: 600,
                            display: "flex", alignItems: "center", gap: 6, opacity: achatMorceauEnCours === m.id ? 0.6 : 1
                          }}
                        >
                          {achatMorceauEnCours === m.id ? (
                            <><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #f59e0b", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Traitement...</>
                          ) : (
                            <>🔒 {m.prix ? `${m.prix} F` : "Acheter"}</>
                          )}
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <AuthModal isOpen={showLogin} onClose={() => { setShowLogin(false); setMorceauEnAttente(null); }} onLoginSuccess={handleLoginSuccess} />
      </div>
    </>
  );
};

export default AlbumDetail;