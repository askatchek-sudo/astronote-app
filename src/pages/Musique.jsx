import { useState, useEffect } from "react";
import { achatsAPI, morceauxAPI } from "../lib/api";
import AuthModal from "../components/AuthModal";
import BoutonFavori from '../components/BoutonFavori';
import BoutonPartage from '../components/BoutonPartage';
import MenuAjoutPlaylist from '../components/MenuAjoutPlaylist';
import { DownloadIcon, ShareIcon } from '../components/Icons';
import AudioVisualizer from '../components/AudioVisualizer';

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/uploads/")) return `http://localhost:3001${img}`;
  if (img.includes("/uploads/")) return `http://localhost:3001/${img.replace(/^\//, "")}`;
  return null;
};

const Musique = ({ artistes, morceaux, albums, setMorceauEnCours, morceauEnCours, setPage, setAlbumSelectionne, currentUser }) => {
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [filtreAcces, setFiltreAcces] = useState("tous");
  const [mesAchats, setMesAchats] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [morceauEnAttente, setMorceauEnAttente] = useState(null);
  const [telechargementEnCours, setTelechargementEnCours] = useState(null);
  
  const maintenant = new Date();

  useEffect(() => {
    if (currentUser) {
      achatsAPI.mesMorceaux().then(data => setMesAchats(data)).catch(err => console.error("Erreur chargement achats:", err));
    } else {
      setMesAchats([]);
    }
  }, [currentUser]);

  const estPayant = (m) => {
    if (!m.isPayant) return false;
    if (!m.expiration) return true;
    return new Date(m.expiration) > maintenant;
  };

  const estDejaAchete = (morceauId, achats = mesAchats) => {
    return achats.some(a => a.morceauId === morceauId || (a.morceau && a.morceau.id === morceauId));
  };

  const estAlbumAchete = (m) => {
    if (!m.albumId) return false;
    return mesAchats.some(a => Number(a.albumId) === Number(m.albumId) && a.actif);
  };

  const liste = morceaux.filter((m) => {
    const artiste = artistes.find((a) => a.id === Number(m.artisteId));
    const okGenre = filtre === "tous" || m.genre === filtre;
    const okRecherche = m.titre.toLowerCase().includes(recherche.toLowerCase()) || (artiste?.nom || "").toLowerCase().includes(recherche.toLowerCase());
    const okAcces = filtreAcces === "tous" || (filtreAcces === "gratuit" && !estPayant(m)) || (filtreAcces === "payant" && estPayant(m));
    return okGenre && okRecherche && okAcces;
  });

  const construireFile = (source) => source.map(track => ({
    ...track,
    audioUrl: track.audioUrl?.startsWith('http') ? track.audioUrl : `http://localhost:3001${track.audioUrl}`
  }));

  const genres = ["tous", ...new Set(morceaux.map((m) => m.genre).filter(Boolean))];
  const nomArtiste = (id) => artistes.find((a) => a.id === Number(id))?.nom || "—";
  const getArtisteImg = (id) => {
    const a = artistes.find((a) => a.id === Number(id));
    return a ? getImageUrl(a.img) || a.img : "🎵";
  };

  // ✅ SÉCURITÉ MAXIMALE : Filtrage AVANT l'envoi au lecteur
  const lancerLecture = (m, sourceListe) => {
    if (!m.audioUrl) return;

    // 1. On ne garde que les morceaux que l'utilisateur a le droit d'écouter
    const listeAccessible = sourceListe.filter(track => {
      const payant = estPayant(track);
      const achete = estDejaAchete(track.id);
      const albumAchete = estAlbumAchete(track);
      return !payant || achete || albumAchete;
    });

    // 2. On construit la playlist uniquement avec cette liste sécurisée
    const fileLecture = construireFile(listeAccessible);
    const indexActuel = fileLecture.findIndex(track => track.id === m.id);
    
    if (indexActuel === -1) {
      setMorceauEnCours({ ...m, audioUrl: m.audioUrl.startsWith('http') ? m.audioUrl : `http://localhost:3001${m.audioUrl}`, playlist: null });
      return;
    }
    
    setMorceauEnCours({ 
      ...fileLecture[indexActuel], 
      playlist: { nom: "Catalogue ASTRONOTE", file: fileLecture, indexActuel, shuffle: false } 
    });
  };

  const handleTelecharger = async (m) => {
    if (!currentUser) { setMorceauEnAttente({ ...m, action: 'telecharger' }); setShowLogin(true); return; }
    setTelechargementEnCours(m.id);
    try { await morceauxAPI.telecharger(m.id); } 
    catch (error) { alert("❌ " + error.message); } 
    finally { setTelechargementEnCours(null); }
  };

  const executerAchat = async (m) => {
    try {
      await achatsAPI.acheterMorceau(m.id);
      const nouveauxAchats = await achatsAPI.mesMorceaux();
      setMesAchats(nouveauxAchats);
      if (m.audioUrl) lancerLecture(m, liste);
    } catch (error) {
      const msg = error.message || "";
      if (!msg.toLowerCase().includes("déjà")) alert("❌ Erreur : " + (msg || "Impossible de réaliser l'achat."));
    }
  };

  const handleAchatClick = (m) => {
    if (!currentUser) { setMorceauEnAttente(m); setShowLogin(true); return; }
    executerAchat(m);
  };

  const handleEcouterClick = (m) => {
    if (!currentUser) {
      setMorceauEnAttente(m);
      setShowLogin(true);
      return;
    }
    lancerLecture(m, liste);
  };

  const handleRowClick = (m) => {
    const albumPayantNonAchete = m.album?.isPayant && !estAlbumAchete(m);
    if (albumPayantNonAchete) {
      if (typeof setAlbumSelectionne === "function") setAlbumSelectionne(m.albumId);
      setPage("album-detail");
      window.scrollTo(0, 0);
    } else {
      if (!estPayant(m) || estDejaAchete(m.id) || estAlbumAchete(m)) {
        handleEcouterClick(m);
      }
    }
  };

  const handleLoginSuccess = (user) => {
    setShowLogin(false);
    window.dispatchEvent(new CustomEvent("fan-connected", { detail: user }));
    localStorage.setItem('user-version', Date.now().toString());
    if (morceauEnAttente) {
      const cible = morceauEnAttente;
      setMorceauEnAttente(null);
      if (cible.action === 'telecharger') { handleTelecharger(cible); return; }
      
      achatsAPI.mesMorceaux().then(nouveauxAchats => {
        setMesAchats(nouveauxAchats);
        if (estPayant(cible) && !estDejaAchete(cible.id, nouveauxAchats) && !estAlbumAchete(cible)) {
          executerAchat(cible);
        } else {
          lancerLecture(cible, liste);
        }
      }).catch(() => {
        if (estPayant(cible) && !estAlbumAchete(cible)) executerAchat(cible);
        else lancerLecture(cible, liste);
      });
    }
  };

  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 50, padding: "12px 18px", color: "var(--text)", fontFamily: "'Exo 2',sans-serif", fontSize: 14, outline: "none" };
  const boutonStyle = (actif, couleur = "var(--cyan)") => ({ padding: "8px 14px", border: `1px solid ${actif ? couleur : "var(--border)"}`, borderRadius: 50, background: actif ? "rgba(6,182,212,0.15)" : "transparent", color: actif ? couleur : "var(--text2)", fontSize: 12, cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap" });
  const iconButtonStyle = (color, bgColor, borderColor) => ({ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: bgColor, border: `1px solid ${borderColor}`, color: color, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 });

  return (
    <>
      {/* ✅ CSS RESPONSIVE */}
      <style>{`
        .responsive-page { padding: 100px 16px 60px !important; }
        .responsive-filters { flex-direction: column; align-items: stretch; }
        .responsive-list-item { padding: 12px 16px !important; }
        .hide-on-mobile { display: none; }
        
        @media (min-width: 768px) {
          .responsive-page { padding: 120px 40px 80px !important; }
          .responsive-filters { flex-direction: row; align-items: center; }
          .responsive-list-item { padding: 12px 24px !important; }
          .hide-on-mobile { display: flex; }
        }
      `}</style>

      <div className="responsive-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="section-tag">Catalogue</div>
          <h1 className="section-title">Notre <span className="glow-text">Musique</span></h1>
          <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 500, margin: "16px auto 0" }}>{morceaux.length} titre(s) dans le catalogue ASTRONOTE.</p>
        </div>

        {/* ✅ FILTRES RESPONSIVES (Empilés sur mobile, alignés sur desktop) */}
        <div className="responsive-filters" style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <input placeholder="🔍 Rechercher un titre ou artiste..." value={recherche} onChange={(e) => setRecherche(e.target.value)} style={inputStyle} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {[["tous", "Tous"], ["gratuit", "🎧 Gratuit"], ["payant", "🔒 Payant"]].map(([val, lb]) => (
              <button key={val} onClick={() => setFiltreAcces(val)} style={{ ...boutonStyle(filtreAcces === val, "var(--gold)"), background: filtreAcces === val ? "rgba(245,158,11,0.15)" : "transparent", color: filtreAcces === val ? "var(--gold)" : "var(--text2)" }}>{lb}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {genres.map((g) => (<button key={g} onClick={() => setFiltre(g)} style={{ ...boutonStyle(filtre === g), textTransform: "capitalize" }}>{g === "tous" ? "Tous genres" : g}</button>))}
          </div>
        </div>

        {liste.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text2)" }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div><div style={{ fontSize: 16 }}>Aucun morceau trouvé.</div></div>
        ) : (
          <div className="glass-card" style={{ overflow: "hidden" }}>
            {liste.map((m, i) => {
              const payant = estPayant(m);
              const dejaAchete = estDejaAchete(m.id);
              const albumAchete = estAlbumAchete(m);
              const peutInteragir = !payant || dejaAchete || albumAchete;
              const estDansAlbumPayant = m.album?.isPayant && !albumAchete;
              const artisteImg = getArtisteImg(m.artisteId);
              const isImageUrl = artisteImg?.startsWith("http");
              const estEnCours = morceauEnCours && String(morceauEnCours.id) === String(m.id);

              return (
                <div 
                  key={m.id} 
                  onClick={() => handleRowClick(m)}
                  className="responsive-list-item"
                  style={{ 
                    display: "flex", alignItems: "center", gap: 12, 
                    borderBottom: i < liste.length - 1 ? "1px solid var(--border)" : "none", 
                    background: estEnCours ? "rgba(6, 182, 212, 0.1)" : "transparent",
                    borderLeft: estEnCours ? "3px solid var(--cyan)" : "3px solid transparent",
                    transition: "all 0.2s", 
                    cursor: estDansAlbumPayant ? "pointer" : "default" 
                  }}
                >
                  <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    {estEnCours ? <AudioVisualizer key={`viz-${m.id}`} isPlaying={true} color="var(--cyan)" /> : <div style={{ textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 14, color: "var(--text2)", fontWeight: 400 }}>{i + 1}</div>}
                  </div>
                  
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: isImageUrl ? "#1a1a2e" : "linear-gradient(135deg,var(--accent),var(--cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, overflow: "hidden" }}>
                    {isImageUrl ? <img src={artisteImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ lineHeight: 1 }}>{artisteImg}</span>}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: estEnCours ? "var(--cyan)" : (peutInteragir ? "var(--text)" : "var(--text2)") }}>{m.titre}</div>
                      {!peutInteragir && (
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, flexShrink: 0, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b" }}>
                          {estDansAlbumPayant ? "🔒 Album" : `🔒 ${m.prix ? `${m.prix} F` : "Payant"}`}
                        </span>
                      )}
                      {peutInteragir && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", color: "var(--vert)" }}>🎧 Disponible</span>}
                    </div>
                    <div style={{ fontSize: 12, color: estEnCours ? "var(--cyan)" : "var(--accent2)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{nomArtiste(m.artisteId)}</span>
                      {m.genre && <span style={{ opacity: 0.7 }}>• {m.genre}</span>}
                    </div>
                  </div>

                  {/* ✅ ACTIONS : flexWrap permet de passer à la ligne sur mobile si nécessaire */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative', zIndex: 10, flexWrap: "wrap", justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                    {peutInteragir && <BoutonFavori morceauId={m.id} currentUser={currentUser} onOpenLogin={() => { setMorceauEnAttente(m); setShowLogin(true); }} />}
                    {peutInteragir && <MenuAjoutPlaylist morceauId={m.id} currentUser={currentUser} onOpenLogin={() => { setMorceauEnAttente(m); setShowLogin(true); }} />}
                    
                    {peutInteragir && m.audioUrl && (
                      <button onClick={() => handleTelecharger(m)} disabled={telechargementEnCours === m.id} style={{ ...iconButtonStyle(telechargementEnCours === m.id ? "var(--text2)" : "var(--vert)", telechargementEnCours === m.id ? "rgba(255,255,255,0.05)" : "rgba(0,230,118,0.1)", telechargementEnCours === m.id ? "var(--border)" : "rgba(0,230,118,0.3)"), cursor: telechargementEnCours === m.id ? "wait" : "pointer", opacity: telechargementEnCours === m.id ? 0.6 : 1 }} title="Télécharger">
                        {telechargementEnCours === m.id ? <span style={{ fontSize: 14 }}>⏳</span> : <DownloadIcon size={16} />}
                      </button>
                    )}

                    {!peutInteragir ? (
                      estDansAlbumPayant ? (
                        <button onClick={() => { if(typeof setAlbumSelectionne === "function") setAlbumSelectionne(m.albumId); setPage("album-detail"); window.scrollTo(0, 0); }} style={{ padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 20, color: "var(--text)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>💿 Album</button>
                      ) : (
                        <button onClick={() => handleAchatClick(m)} style={{ padding: "8px 12px", background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.1))", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 20, color: "#f59e0b", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>🔒 {m.prix ? `${m.prix} F` : "Acheter"}</button>
                      )
                    ) : m.audioUrl ? (
                      <button onClick={() => handleEcouterClick(m)} style={{ ...iconButtonStyle(estEnCours ? "#fff" : "var(--cyan)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.1)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.3)"), width: 40, height: 40, fontSize: 18 }} title="Écouter">
                        {estEnCours ? "⏸" : "▶"}
                      </button>
                    ) : <span style={{ fontSize: 12, color: "var(--text2)", opacity: 0.5, width: 40, textAlign: "center" }}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AuthModal isOpen={showLogin} onClose={() => { setShowLogin(false); setMorceauEnAttente(null); }} onLoginSuccess={handleLoginSuccess} />
      </div>
    </>
  );
};

export default Musique;