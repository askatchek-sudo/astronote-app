import { useState, useEffect } from "react";
import { achatsAPI, morceauxAPI, albumsAPI } from "../lib/api";
import AuthModal from "../components/AuthModal";
import BoutonPartage from '../components/BoutonPartage';
import BoutonFavori from '../components/BoutonFavori';
import { DownloadIcon, ShareIcon } from '../components/Icons';
import AudioVisualizer from '../components/AudioVisualizer';

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/uploads/")) return `http://localhost:3001${img}`;
  if (img.includes("/uploads/")) return `http://localhost:3001/${img.replace(/^\//, "")}`;
  return null;
};

const AlbumDetail = ({ albumId, artistes, morceaux, albums, setMorceauEnCours, morceauEnCours, setPage, setAlbumSelectionne, currentUser }) => {
  const album = albums.find(a => String(a.id) === String(albumId));
  
  const [showLogin, setShowLogin] = useState(false);
  const [morceauEnAttente, setMorceauEnAttente] = useState(null);
  const [mesAchats, setMesAchats] = useState([]);
  const [telechargementEnCours, setTelechargementEnCours] = useState(null);
  const [achatAlbumEnCours, setAchatAlbumEnCours] = useState(false);

  // ✅ VÉRIFICATION STRICTE POUR LA GRATUITÉ (Uniquement pour stetw avec les bonnes infos)
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

  const executerAchatAlbum = async () => {
    if (!currentUser) { setShowLogin(true); return; }
    setAchatAlbumEnCours(true);
    try {
      const userActuel = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      await albumsAPI.acheterAlbum({ albumId: album.id, userId: userActuel.id });
      const nouveauxAchats = await achatsAPI.mesMorceaux();
      setMesAchats(nouveauxAchats);
      alert("✅ Album acheté avec succès ! Tous les titres sont maintenant déblocés.");
    } catch (error) {
      alert("❌ Erreur : " + (error.message || "Impossible de réaliser l'achat."));
    } finally { setAchatAlbumEnCours(false); }
  };

  const construireFile = (source) => source.map(track => ({
    ...track,
    audioUrl: track.audioUrl?.startsWith('http') ? track.audioUrl : `http://localhost:3001${track.audioUrl}`
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
      setMorceauEnCours({ ...m, audioUrl: m.audioUrl.startsWith('http') ? m.audioUrl : `http://localhost:3001${m.audioUrl}`, playlist: null });
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
      {/* ✅ CSS RESPONSIVE AMÉLIORÉ POUR LA POCHETTE D'ALBUM */}
      <style>{`
        .responsive-page { padding: 100px 16px 60px !important; }
        
        /* Mobile : Empilé, centré, pochette carrée naturelle */
        .responsive-header-grid { 
          grid-template-columns: 1fr !important; 
          text-align: center !important; 
          min-height: auto !important; 
        }
        .responsive-header-img { 
          width: 220px !important; 
          height: 220px !important; 
          margin: 0 auto 24px auto !important; 
          border-radius: 12px !important; 
          box-shadow: 0 12px 32px rgba(0,0,0,0.4) !important; /* Effet de profondeur naturel */
        }
        /* Mobile : Dégradé subtil par le bas pour ne pas assombrir le centre de l'image */
        .responsive-img-overlay {
          background: linear-gradient(0deg, rgba(8,11,24,0.9) 0%, transparent 50%) !important;
        }
        
        .responsive-list-item { padding: 12px 16px !important; }
        .responsive-banner { flex-direction: column; text-align: center; }
        
        /* Desktop : Retour à la mise en page originale */
        @media (min-width: 768px) {
          .responsive-page { padding: 120px 40px 80px !important; }
          .responsive-header-grid { 
            grid-template-columns: 280px 1fr !important; 
            text-align: left !important; 
            min-height: 280px !important; 
          }
          .responsive-header-img { 
            width: 100% !important; 
            height: 100% !important; 
            margin: 0 !important; 
            border-radius: 0 !important; 
            box-shadow: none !important;
          }
          /* Desktop : Dégradé latéral pour la transition vers le texte */
          .responsive-img-overlay {
            background: linear-gradient(90deg, transparent 50%, rgba(8,11,24,0.9) 100%) !important;
          }
          .responsive-list-item { padding: 12px 24px !important; }
          .responsive-banner { flex-direction: row; text-align: left; }
        }
      `}</style>

      <div className="responsive-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <button onClick={() => setPage("accueil")} style={{ marginBottom: 24, padding: "8px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 50, color: "var(--text2)", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>← Retour</button>

        <div className="glass-card" style={{ overflow: "hidden", marginBottom: 32, animation: "fadeUp 0.6s ease both" }}>
          <div className="responsive-header-grid" style={{ display: "grid", gap: 0 }}>
            
            {/* ✅ CONTENEUR D'IMAGE AVEC CLASSE POUR LE DÉGRADÉ ADAPTATIF */}
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
                {album.annee && (
                  <span style={{ padding: "6px 14px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 50, color: "var(--cyan)", fontWeight: 600 }}>📅 {album.annee}</span>
                )}
                {album.genre && (
                  <span style={{ padding: "6px 14px", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: 50, color: "var(--vert)", fontWeight: 600 }}>🎵 {album.genre}</span>
                )}
              </div>

              {/* ✅ BANNIÈRE D'ACHAT MODIFIÉE POUR STETW */}
              {album.isPayant && !estAlbumAchete && (
                <div className="responsive-banner" style={{ 
                  marginBottom: 20, 
                  padding: 16, 
                  background: isStetwVerified ? "rgba(0,230,118,0.1)" : "rgba(245,158,11,0.1)", 
                  border: `1px solid ${isStetwVerified ? "rgba(0,230,118,0.3)" : "rgba(245,158,11,0.3)"}`, 
                  borderRadius: 12, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  gap: 12 
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: isStetwVerified ? "#00e676" : "#f59e0b", fontWeight: 700, letterSpacing: 1 }}>
                      {isStetwVerified ? "OFFRE SPÉCIALE VIP" : "ALBUM PAYANT"}
                    </div>
                    <div style={{ fontSize: 24, fontFamily: "'Orbitron',sans-serif", fontWeight: 900, color: isStetwVerified ? "#00e676" : "#fff" }}>
                      {isStetwVerified ? "GRATUIT 🎁" : `${album.prix} FCFA`}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>Débloque tous les titres d'un coup</div>
                  </div>
                  <button 
                    onClick={executerAchatAlbum} 
                    disabled={achatAlbumEnCours} 
                    style={{ 
                      padding: "12px 24px", 
                      background: isStetwVerified ? "linear-gradient(135deg, #00e676, #00c853)" : "linear-gradient(135deg, #f59e0b, #d97706)", 
                      border: "none", 
                      borderRadius: 8, 
                      color: "#fff", 
                      fontSize: 14, 
                      fontWeight: 700, 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 8, 
                      justifyContent: "center" 
                    }}
                  >
                    {achatAlbumEnCours ? "⏳ Traitement..." : (isStetwVerified ? "🎁 Obtenir gratuitement" : "🛒 Acheter l'album")}
                  </button>
                </div>
              )}
              
              {estAlbumAchete && (
                <div style={{ marginBottom: 20, padding: 12, background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#00e676", fontWeight: 700, fontSize: 14 }}>
                  ✅ Vous possédez cet album. Tous les titres sont déblocés.
                </div>
              )}

              {album.description && <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginBottom: 24, textAlign: "center" }}>{album.description}</p>}
              
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--cyan)" }}>{morceauxAlbum.length}</div><div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase" }}>Titres</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--accent2)" }}>{morceauxAlbum.reduce((total, m) => total + (m.streams || 0), 0)}</div><div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase" }}>Streams</div></div>
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
              const estBloque = album.isPayant && !estAlbumAchete;
              const peutInteragir = !estBloque;
              const estEnCours = morceauEnCours && String(morceauEnCours.id) === String(m.id);

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
                        {estBloque ? "🔒 Album" : "🎧 Disponible"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: estEnCours ? "var(--cyan)" : "var(--text2)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                      {m.annee && <span>{m.annee} · </span>}
                      {m.streams && <span>{m.streams} streams</span>}
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
                      <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)", opacity: 0.5, cursor: "not-allowed" }} title="Achetez l'album pour débloquer ce titre">🔒</div>
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