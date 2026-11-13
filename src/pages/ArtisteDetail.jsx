import { useState, useEffect } from "react";
import { achatsAPI, morceauxAPI, paiementAPI } from "../lib/api"; // ✅ AJOUT DE paiementAPI
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

const ArtisteDetail = ({ artisteId, artistes, morceaux, albums, setMorceauEnCours, morceauEnCours, setPage, setAlbumSelectionne, currentUser }) => {
  const artiste = artistes.find(a => a.id === Number(artisteId));
  
  const [showLogin, setShowLogin] = useState(false);
  const [morceauEnAttente, setMorceauEnAttente] = useState(null);
  const [tab, setTab] = useState("morceaux");
  const [mesAchats, setMesAchats] = useState([]);
  const [telechargementEnCours, setTelechargementEnCours] = useState(null);

  useEffect(() => {
    if (currentUser) {
      achatsAPI.mesMorceaux().then(data => setMesAchats(data)).catch(err => console.error("❌ Erreur chargement achats:", err));
    } else {
      setMesAchats([]);
    }
  }, [currentUser]);

  if (!artiste) {
    return (
      <div style={{ padding: "120px 20px 80px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
        <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, marginBottom: 16 }}>Artiste introuvable</h1>
        <button className="btn-outline" onClick={() => setPage("artistes")} style={{ marginTop: 20 }}>← Retour aux artistes</button>
      </div>
    );
  }

  const morceauxArtiste = morceaux.filter(m => Number(m.artisteId) === Number(artisteId));
  const albumsArtiste = albums.filter(a => Number(a.artisteId) === Number(artisteId));

  const maintenant = new Date();
  const estPayant = (m) => !m.isPayant ? false : (!m.expiration ? true : new Date(m.expiration) > maintenant);
  const estDejaAchete = (morceauId) => {
    const id = Number(morceauId);
    return mesAchats.some(a => Number(a.morceauId) === id || (a.morceau && Number(a.morceau.id) === id));
  };
  const estAlbumAchete = (m) => m.albumId ? mesAchats.some(a => Number(a.albumId) === Number(m.albumId) && a.actif) : false;

  const handleTelecharger = async (m) => {
    if (!currentUser) { setMorceauEnAttente({ ...m, action: 'telecharger' }); setShowLogin(true); return; }
    if (!m.audioUrl) return;
    setTelechargementEnCours(m.id);
    try { await morceauxAPI.telecharger(m.id); } 
    catch (error) { alert("❌ " + error.message); } 
    finally { setTelechargementEnCours(null); }
  };

  const construireFile = (source) => source.map(track => ({
    ...track,
    audioUrl: track.audioUrl?.startsWith('http') ? track.audioUrl : `http://localhost:3001${track.audioUrl}`
  }));

  const lancerLectureArtiste = (m, sourceListe) => {
    if (!m || !m.audioUrl) return;
    const listeAccessible = sourceListe.filter(track => {
      const payant = estPayant(track);
      const achete = estDejaAchete(track.id);
      const albumAchete = estAlbumAchete(track);
      return !payant || achete || albumAchete;
    });
    const fileLecture = construireFile(listeAccessible);
    const indexActuel = fileLecture.findIndex(track => track.id === m.id);
    
    if (indexActuel === -1) {
      setMorceauEnCours({ ...m, audioUrl: m.audioUrl.startsWith('http') ? m.audioUrl : `http://localhost:3001${m.audioUrl}`, playlist: null });
      return;
    }
    
    setMorceauEnCours({ 
      ...fileLecture[indexActuel], 
      playlist: { nom: `Titres de ${artiste.nom}`, file: fileLecture, indexActuel, shuffle: false } 
    });
  };

  // ✅ NOUVELLE FONCTION D'ACHAT AVEC POPUP CAMERPAY
  const executerAchat = async (m) => {
    if (!currentUser) {
      setMorceauEnAttente({ morceau: m, action: 'acheter' });
      setShowLogin(true);
      return;
    }
    try {
      const userActuel = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      
      const dataPaiement = {
        userId: userActuel.id,
        type: 'morceau',
        itemId: m.id,
        montant: m.prix || 100,
        description: `Achat du morceau "${m.titre}" sur ASTRONOTE`,
        customerName: userActuel.nom || 'Client ASTRONOTE',
        customerEmail: userActuel.email || 'client@astronote.com',
        customerPhone: userActuel.telephone || '600000000'
      };

      const reponsePaiement = await paiementAPI.initier(dataPaiement);
      
      if (reponsePaiement.success && reponsePaiement.paymentUrl) {
        const largeur = 450;
        const hauteur = 700;
        const gauche = (window.screen.width - largeur) / 2;
        const haut = (window.screen.height - hauteur) / 2;
        
        const popup = window.open(
          reponsePaiement.paymentUrl,
          'Paiement ASTRONOTE',
          `width=${largeur},height=${hauteur},left=${gauche},top=${haut},scrollbars=yes,resizable=yes`
        );

        const verifierPaiement = setInterval(() => {
          if (popup.closed) {
            clearInterval(verifierPaiement);
            achatsAPI.mesMorceaux()
              .then(nouveauxAchats => {
                setMesAchats(nouveauxAchats);
                const estAchete = nouveauxAchats.some(a => Number(a.morceauId) === Number(m.id) || (a.morceau && Number(a.morceau.id) === Number(m.id)));
                if (estAchete && m.audioUrl) {
                  lancerLectureArtiste(m, morceauxArtiste);
                }
              })
              .catch(console.error);
          }
        }, 2000);
      } else {
        throw new Error("Impossible d'initialiser le paiement.");
      }
    } catch (error) {
      console.error("Erreur achat morceau:", error);
      alert("❌ Erreur : " + (error.message || "Impossible de réaliser l'achat."));
    }
  };

  const handlePlayClick = (m) => {
    if (!currentUser) {
      setMorceauEnAttente({ morceau: m, action: 'ecouter' });
      setShowLogin(true);
      return;
    }
    lancerLectureArtiste(m, morceauxArtiste);
  };

  const handleLoginSuccess = (user) => {
    setShowLogin(false);
    window.dispatchEvent(new CustomEvent("fan-connected", { detail: user }));
    localStorage.setItem('user-version', Date.now().toString());
    if (morceauEnAttente) {
      const { morceau, action } = morceauEnAttente;
      setMorceauEnAttente(null);
      if (action === 'telecharger') handleTelecharger(morceau);
      else if (action === "acheter" || estPayant(morceau)) executerAchat(morceau);
      else if (action === 'ecouter') lancerLectureArtiste(morceau, morceauxArtiste);
    }
  };

  const handleRowClick = (m) => {
    const albumPayantNonAchete = m.album?.isPayant && !estAlbumAchete(m);
    if (albumPayantNonAchete) {
      if (typeof setAlbumSelectionne === "function") setAlbumSelectionne(m.albumId);
      setPage("album-detail");
      window.scrollTo(0, 0);
    } else {
      if (!estPayant(m) || estDejaAchete(m.id) || estAlbumAchete(m)) {
        handlePlayClick(m);
      }
    }
  };

  const imgArtiste = getImageUrl(artiste.img);
  const isImageUrl = imgArtiste !== null;
  const iconButtonStyle = (color, bgColor, borderColor, size = 36) => ({
    width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    background: bgColor, border: `1px solid ${borderColor}`, color: color, cursor: "pointer", transition: "all 0.2s", flexShrink: 0, fontSize: size === 32 ? 14 : 16
  });

  return (
    <>
      <style>{`
        .responsive-page { padding: 100px 16px 60px !important; }
        .responsive-header-grid { grid-template-columns: 1fr !important; text-align: center !important; min-height: auto !important; }
        .responsive-header-img { width: 200px !important; height: 200px !important; margin: 0 auto 24px auto !important; border-radius: 50% !important; box-shadow: 0 12px 32px rgba(0,0,0,0.4) !important; }
        .responsive-img-overlay { background: linear-gradient(0deg, rgba(8,11,24,0.8) 0%, transparent 60%) !important; }
        .responsive-list-item { padding: 12px 16px !important; }
        .responsive-tabs { justify-content: center; }
        
        @media (min-width: 768px) {
          .responsive-page { padding: 120px 40px 80px !important; }
          .responsive-header-grid { grid-template-columns: 300px 1fr !important; text-align: left !important; min-height: 320px !important; }
          .responsive-header-img { width: 100% !important; height: 100% !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
          .responsive-img-overlay { background: linear-gradient(90deg, transparent 50%, rgba(8,11,24,0.9) 100%) !important; }
          .responsive-list-item { padding: 12px 24px !important; }
          .responsive-tabs { justify-content: flex-start; }
        }
      `}</style>

      <div className="responsive-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <button onClick={() => setPage("artistes")} style={{ marginBottom: 24, padding: "8px 18px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 50, color: "var(--text2)", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          ← Retour aux artistes
        </button>

        <div className="glass-card" style={{ overflow: "hidden", marginBottom: 32, animation: "fadeUp 0.6s ease both" }}>
          <div className="responsive-header-grid" style={{ display: "grid", gap: 0 }}>
            <div className="responsive-header-img" style={{ background: isImageUrl ? "#1a1a2e" : "linear-gradient(135deg,var(--accent),var(--cyan))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              {isImageUrl ? (
                <img src={imgArtiste} alt={artiste.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 80, lineHeight: 1 }}>{artiste.img || "🎤"}</span>
              )}
              <div className="responsive-img-overlay" style={{ position: "absolute", inset: 0 }} />
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Artiste ASTRONOTE</div>
              <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 900, letterSpacing: 2, marginBottom: 12, lineHeight: 1.1 }} className="glow-text">{artiste.nom}</h1>
              
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, fontSize: 14, justifyContent: "center" }}>
                <span style={{ padding: "6px 14px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 50, color: "var(--accent2)", fontWeight: 600 }}>🎵 {artiste.genre}{artiste.genre2 ? ` / ${artiste.genre2}` : ""}</span>
                <span style={{ padding: "6px 14px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 50, color: "var(--cyan)", fontWeight: 600 }}>{artiste.pays}</span>
              </div>
              
              <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginBottom: 24, textAlign: "center" }}>{artiste.bio}</p>
              
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--cyan)" }}>{artiste.streams}</div><div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase" }}>Streams</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--accent2)" }}>{morceauxArtiste.length}</div><div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase" }}>Titres</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--pink)" }}>{albumsArtiste.length}</div><div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase" }}>Albums</div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="responsive-tabs" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {[{ id: "morceaux", label: `🎵 Morceaux (${morceauxArtiste.length})` }, { id: "albums", label: `💿 Albums (${albumsArtiste.length})` }, { id: "biographie", label: "📝 Biographie" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 20px", background: tab === t.id ? "rgba(124,58,237,0.15)" : "transparent", border: `1px solid ${tab === t.id ? "var(--accent)" : "var(--border)"}`, borderRadius: 50, color: tab === t.id ? "var(--accent2)" : "var(--text2)", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}>{t.label}</button>
          ))}
        </div>

        {tab === "morceaux" && (
          <div className="glass-card" style={{ overflow: "hidden" }}>
            {morceauxArtiste.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "var(--text2)" }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div><div>Aucun morceau disponible pour le moment.</div></div>
            ) : (
              morceauxArtiste.map((m, i) => {
                const payant = estPayant(m);
                const dejaAchete = estDejaAchete(m.id);
                const albumAchete = estAlbumAchete(m);
                const peutInteragir = !payant || dejaAchete || albumAchete;
                const estDansAlbumPayant = m.album?.isPayant && !albumAchete;
                const estEnCours = morceauEnCours && String(morceauEnCours.id) === String(m.id);

                return (
                  <div 
                    key={m.id} 
                    onClick={() => handleRowClick(m)}
                    className="responsive-list-item"
                    style={{ 
                      display: "flex", alignItems: "center", gap: 12, 
                      borderBottom: i < morceauxArtiste.length - 1 ? "1px solid var(--border)" : "none", 
                      background: estEnCours ? "rgba(6, 182, 212, 0.1)" : "transparent",
                      borderLeft: estEnCours ? "3px solid var(--cyan)" : "3px solid transparent",
                      transition: "background .2s", 
                      cursor: estDansAlbumPayant ? "pointer" : "default" 
                    }}
                  >
                    <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                      {estEnCours ? <AudioVisualizer key={`viz-${m.id}`} isPlaying={true} color="var(--cyan)" /> : <div style={{ textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 14, color: "var(--text2)", fontWeight: 400 }}>{i + 1}</div>}
                    </div>

                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,var(--accent),var(--cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎵</div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: estEnCours ? "var(--cyan)" : (peutInteragir ? "var(--text)" : "var(--text2)") }}>{m.titre}</div>
                        {!peutInteragir && (
                          <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, flexShrink: 0, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b" }}>
                            {estDansAlbumPayant ? "🔒 Album" : `🔒 ${m.prix ? `${m.prix} F` : "Payant"}`}
                          </span>
                        )}
                        {peutInteragir && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", color: "var(--vert)" }}>🎧 Disponible</span>}
                      </div>
                      <div style={{ fontSize: 12, color: estEnCours ? "var(--cyan)" : "var(--text2)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                        {m.album && <span style={{ color: "var(--accent2)" }}>{m.album.titre}</span>}
                        {m.album && m.annee && <span>·</span>}
                        {m.annee && <span>{m.annee}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative', zIndex: 10, flexWrap: "wrap", justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                      {peutInteragir && (
                        <BoutonFavori morceauId={m.id} currentUser={currentUser} onOpenLogin={() => { setMorceauEnAttente({ morceau: m, action: 'partager' }); setShowLogin(true); }} />
                      )}
                      
                      {peutInteragir && (
                        <BoutonPartage titre={m.titre} texte={`🎵 Écoute "${m.titre}" de ${artiste.nom} sur ASTRONOTE !`} url={`${window.location.origin}/artiste/${artiste.id}?morceau=${m.id}`} type="morceau" currentUser={currentUser} onOpenLogin={() => { setMorceauEnAttente({ morceau: m, action: 'partager' }); setShowLogin(true); }} icon={<ShareIcon size={16} />} />
                      )}

                      {!peutInteragir ? (
                        estDansAlbumPayant ? (
                          <button onClick={() => { if(typeof setAlbumSelectionne === "function") setAlbumSelectionne(m.albumId); setPage("album-detail"); window.scrollTo(0, 0); }} style={{ padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 20, color: "var(--text)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>💿 Album</button>
                        ) : (
                          <button onClick={() => executerAchat(m)} style={{ padding: "8px 12px", background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.1))", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 20, color: "#f59e0b", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>🔒 {m.prix ? `${m.prix} F` : "Acheter"}</button>
                        )
                      ) : m.audioUrl ? (
                        <button onClick={() => handlePlayClick(m)} style={{ ...iconButtonStyle(estEnCours ? "#fff" : "var(--cyan)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.1)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.3)"), width: 40, height: 40, fontSize: 18 }} title="Écouter">
                          {estEnCours ? "⏸" : "▶"}
                        </button>
                      ) : <span style={{ fontSize: 12, color: "var(--text2)", opacity: 0.5, width: 40, textAlign: "center" }}>—</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "albums" && (
          <div>
            {albumsArtiste.length === 0 ? (
              <div className="glass-card" style={{ padding: 60, textAlign: "center", color: "var(--text2)" }}><div style={{ fontSize: 48, marginBottom: 16 }}>💿</div><div>Aucun album disponible pour le moment.</div></div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
                {albumsArtiste.map(a => {
                  const coverUrl = getImageUrl(a.coverUrl);
                  const nbMorceaux = morceaux.filter(m => Number(m.albumId) === Number(a.id)).length;
                  return (
                    <div key={a.id} className="glass-card" style={{ overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }} onClick={() => { if(typeof setAlbumSelectionne === "function") setAlbumSelectionne(a.id); setPage("album-detail"); window.scrollTo(0, 0); }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                      <div style={{ aspectRatio: "1", background: coverUrl ? "#1a1a2e" : "linear-gradient(135deg,var(--accent),var(--pink))", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {coverUrl ? <img src={coverUrl} alt={a.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 48, lineHeight: 1 }}>{a.coverEmoji || "💿"}</span>}
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.titre}</div>
                        <div style={{ fontSize: 11, color: "var(--text2)" }}>{a.annee} · {nbMorceaux} titre{nbMorceaux > 1 ? "s" : ""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "biographie" && (
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 2, marginBottom: 20, color: "var(--accent2)" }}>À propos de {artiste.nom}</h3>
            <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{artiste.bio}</p>
          </div>
        )}

        <AuthModal isOpen={showLogin} onClose={() => { setShowLogin(false); setMorceauEnAttente(null); }} onLoginSuccess={handleLoginSuccess} />
      </div>
    </>
  );
};

export default ArtisteDetail;