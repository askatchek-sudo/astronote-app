import { useState, useEffect } from "react";
import { GENRES, PAYS_LIST_ADMIN, ALBUMS_INIT, EVENEMENTS_INIT } from "../../data/initialData";
import EvenementsAdmin from "./EvenementsAdmin";
import AlbumsAdmin from "./AlbumsAdmin";
import MessagesAdmin from "./MessagesAdmin";
import AudioPlayer from "../../components/AudioPlayer";
// ✅ 1. AJOUT DE uploadAPI ICI
import { artistesAPI, morceauxAPI, messagesAPI, authAPI, uploadAPI } from "../../lib/api";
import VentesAdmin from "./VentesAdmin";
import ScannerTickets from "../../components/admin/ScannerTickets";
import AnalyticsDashboard from "../../components/admin/AnalyticsDashboard";
import logo from '../../assets/logo.png';
import ActualitesAdmin from "./ActualitesAdmin";

const PageAdmin = ({ artistes, setArtistes, morceaux, setMorceaux, albumsApp, setAlbumsApp, evenementsApp, setEvenementsApp }) => {
  const [connecte, setConnecte] = useState(false);
  const [form, setForm] = useState({ login: "", mdp: "" });
  const [err, setErr] = useState("");
  const [vue, setVue] = useState("dashboard");
  const [messagesNonLus, setMessagesNonLus] = useState(0);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const albums = albumsApp || ALBUMS_INIT;
  const setAlbums = setAlbumsApp || (() => { });
  const evenements = evenementsApp || EVENEMENTS_INIT;
  const setEvenements = setEvenementsApp || (() => { });

  const [toast, setToast] = useState(null);
  
  const artInit = { nom: "", genre: "", genre2: "", pays: "🇨🇮", bio: "", img: "🎵", streams: "0", tracks: "0", telephone: "", imgFile: null, imgPreview: null };
  const [artForm, setArtForm] = useState(artInit);
  const [artEdit, setArtEdit] = useState(null);

  // ✅ 2. AJOUT DU CHAMP 'fichier' pour stocker l'objet File réel (pas juste l'URL blob)
  const morInit = { titre: "", artisteId: "", duree: "", genre: "", album: "", annee: new Date().getFullYear(), streams: "0", lien: "", fichier: null, fichierNom: "", payant: false, prix: "", dureePaiement: "7" };
  const [morForm, setMorForm] = useState(morInit);
  const [morEdit, setMorEdit] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const chargerCompteur = async () => {
      try {
        const data = await messagesAPI.getAll();
        setMessagesNonLus(data.filter(m => !m.lu).length);
      } catch (error) {
        console.error('Erreur compteur messages:', error);
      }
    };
    chargerCompteur();
    const interval = setInterval(chargerCompteur, 30000);
    return () => clearInterval(interval);
  }, []);

  const login = async () => {
    setErr("");
    try {
      const data = await authAPI.login(form.login, form.mdp);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setConnecte(true);
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setErr("Identifiants incorrects. Essayez : admin / astronote2026");
    }
  };

  const sauvegarderArtiste = async () => {
    if (!artForm.nom || !artForm.genre || !artForm.bio) {
      showToast("Remplissez les champs obligatoires.", "error");
      return;
    }
    try {
      let imgUrl = artForm.img || "🎵"; // Conserve l'ancienne valeur ou l'emoji par défaut
      
      // ✅ 3. UTILISATION DE uploadAPI.image (gère automatiquement le token d'auth)
      if (artForm.imgFile) {
        showToast("⏳ Upload de l'image en cours...", "info");
        const uploadResult = await uploadAPI.image(artForm.imgFile);
        imgUrl = uploadResult.url;
        showToast("✅ Image uploadée !", "success");
      }
      
      const dataArtiste = {
        nom: artForm.nom, genre: artForm.genre, genre2: artForm.genre2 || null, pays: artForm.pays || "🇨🇮",
        bio: artForm.bio, img: imgUrl, streams: artForm.streams || "0", tracks: Number(artForm.tracks) || 0,
        telephone: artForm.telephone || ""
      };
      
      if (artEdit) {
        const updated = await artistesAPI.update(artEdit, dataArtiste);
        setArtistes(prev => prev.map(a => a.id === artEdit ? updated : a));
        showToast(`✦ ${artForm.nom} mis à jour !`);
        setArtEdit(null);
      } else {
        const nouveau = await artistesAPI.create(dataArtiste);
        setArtistes(prev => [...prev, nouveau]);
        showToast(`✦ ${artForm.nom} ajouté au roster !`);
      }
      setArtForm(artInit);
    } catch (error) {
      console.error("Erreur sauvegarde artiste:", error);
      showToast("Erreur lors de la sauvegarde: " + error.message, "error");
    }
  };

  const editerArtiste = (a) => {
    setArtForm({ ...a, imgFile: null, imgPreview: null });
    setArtEdit(a.id);
    setVue("artistes");
    if (isMobile) setSidebarOpen(false);
  };

  const supprimerArtiste = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cet artiste ?")) return;
    try {
      await artistesAPI.delete(id);
      setArtistes(prev => prev.filter(a => a.id !== id));
      setMorceaux(prev => prev.filter(m => m.artisteId !== id));
      showToast("🗑 Artiste supprimé.", "error");
    } catch (error) {
      showToast("Erreur: " + error.message, "error");
    }
  };

  const sauvegarderMorceau = async () => {
    if (!morForm.titre || !morForm.artisteId) {
      showToast("Titre et artiste obligatoires.", "error");
      return;
    }
    try {
      let audioUrl = morForm.lien; // Conserve l'ancienne URL si on modifie sans changer le fichier
      
      // ✅ 4. UTILISATION DE uploadAPI.audio (gère automatiquement le token d'auth)
      if (morForm.fichier) {
        showToast("⏳ Upload du fichier audio en cours...", "info");
        const uploadResult = await uploadAPI.audio(morForm.fichier);
        audioUrl = uploadResult.url;
        showToast("✅ Fichier audio uploadé !", "success");
      }

      let albumId = null;
      if (morForm.album) {
        const albumTrouve = albums.find(a => a.titre === morForm.album);
        if (albumTrouve) albumId = albumTrouve.id;
      }

      const dataMorceau = {
        titre: morForm.titre,
        artisteId: Number(morForm.artisteId),
        albumId: albumId,
        duree: morForm.duree || null,
        genre: morForm.genre || null,
        annee: Number(morForm.annee) || new Date().getFullYear(),
        streams: morForm.streams || "0",
        audioUrl: audioUrl || null,
        isPayant: morForm.payant || false,
        prix: morForm.payant ? Number(morForm.prix) : null,
        dureeAcces: morForm.payant ? Number(morForm.dureePaiement) : null,
      };

      if (morEdit) {
        const updated = await morceauxAPI.update(morEdit, dataMorceau);
        setMorceaux(prev => prev.map(m => m.id === morEdit ? updated : m));
        showToast(`🎵 "${morForm.titre}" mis à jour !`);
        setMorEdit(null);
      } else {
        const nouveau = await morceauxAPI.create(dataMorceau);
        setMorceaux(prev => [...prev, nouveau]);
        showToast(`🎵 "${morForm.titre}" ajouté !`);
      }
      setMorForm(morInit);
    } catch (error) {
      console.error("Erreur sauvegarde morceau:", error);
      showToast("Erreur lors de la sauvegarde: " + error.message, "error");
    }
  };

  const editerMorceau = (m) => {
    setMorForm({ ...m, artisteId: String(m.artisteId), album: m.album?.titre || "", fichier: null });
    setMorEdit(m.id);
    setVue("morceaux");
    if (isMobile) setSidebarOpen(false);
  };

  const supprimerMorceau = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce morceau ?")) return;
    try {
      await morceauxAPI.delete(id);
      setMorceaux(prev => prev.filter(m => m.id !== id));
      showToast(" Morceau supprimé.", "error");
    } catch (error) {
      showToast("Erreur: " + error.message, "error");
    }
  };

  const nomArtiste = (id) => artistes.find(a => a.id === Number(id))?.nom || "—";

  // ─── ÉCRAN DE CONNEXION ADMIN ───────────
  if (!connecte) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "radial-gradient(circle at top right, rgba(124,58,237,0.1), transparent 40%)", position: "relative" }}>
      <button 
        onClick={() => window.location.href = '/'} 
        style={{ 
          position: 'absolute', top: 24, left: 24, zIndex: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 50, padding: '10px 20px', color: 'var(--text2)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 600, transition: 'all 0.2s', backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cyan)'; e.currentTarget.style.borderColor = 'var(--cyan)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      >
        ← Retour au site public
      </button>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "48px 36px", width: "100%", maxWidth: 420, backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
            <img src={logo} alt="ASTRONOTE" style={{ height: 50, width: "auto", filter: "drop-shadow(0 0 12px rgba(6, 182, 212, 0.4))" }} />
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: 3, background: 'linear-gradient(90deg, var(--accent2), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ASTRONOTE</span>
          </div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, letterSpacing: 4, marginBottom: 4 }} className="glow-text">ADMIN PANEL</div>
          <div style={{ fontSize: 12, color: "var(--text2)", letterSpacing: 1 }}>Accès restreint au personnel autorisé</div>
        </div>
        
        {err && (
          <div style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: 10, padding: "12px 16px", color: "var(--pink)", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            ⚠️ {err}
          </div>
        )}
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Identifiant</label>
          <input className="admin-input-fix" placeholder="admin" value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "var(--text)", fontFamily: "'Exo 2', sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Mot de passe</label>
          <input className="admin-input-fix" type="password" placeholder="••••••••" value={form.mdp} onChange={e => setForm({ ...form, mdp: e.target.value })} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "var(--text)", fontFamily: "'Exo 2', sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        
        <button className="btn-primary" onClick={login} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px", fontSize: 14, fontWeight: 700, letterSpacing: 1, background: "linear-gradient(135deg, var(--accent), var(--cyan))", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer" }}>
          🔓 SE CONNECTER
        </button>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "var(--text2)", fontFamily: "'Space Mono', monospace" }}>
          Par défaut : admin / astronote2026
        </div>
      </div>
    </div>
  );

  // ─── PANNEAU ADMIN CONNECTÉ ──────────
  return (
    <>
      <style>{`
        .admin-layout { display: flex; min-height: 100vh; background: var(--bg, #080b18); }
        .admin-sidebar { width: 250px; background: rgba(8,11,24,0.98); border-right: 1px solid rgba(255,255,255,0.06); position: fixed; top: 0; left: 0; bottom: 0; z-index: 50; display: flex; flex-direction: column; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .admin-content { flex: 1; margin-left: 250px; padding: 100px 40px 60px; transition: margin 0.3s ease; width: 100%; box-sizing: border-box; }
        .admin-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; }
        .admin-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .admin-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 14px; color: var(--text); font-family: 'Exo 2', sans-serif; font-size: 14px; outline: none; box-sizing: border-box; transition: all 0.2s; }
        .admin-input:focus { border-color: var(--cyan); background: rgba(6,182,212,0.05); }
        .admin-card-hover { transition: all 0.2s ease; }
        .admin-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .mobile-menu-btn { display: none; position: fixed; top: 16px; left: 16px; z-index: 60; background: var(--bg-elevated, rgba(15,23,42,0.9)); border: 1px solid var(--border); border-radius: 10px; padding: 10px; color: var(--text); cursor: pointer; backdrop-filter: blur(10px); }
        
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); width: 280px; }
          .admin-sidebar.open { transform: translateX(0); box-shadow: 10px 0 40px rgba(0,0,0,0.5); }
          .admin-content { margin-left: 0; padding: 80px 16px 40px; }
          .mobile-menu-btn { display: flex; align-items: center; justify-content: center; }
        }
      `}</style>

      <div className="admin-layout">
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, backdropFilter: "blur(4px)" }} />
        )}

        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? "✕" : "☰"}
        </button>

        <div className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <img src={logo} alt="ASTRONOTE" style={{ height: 32, width: "auto", filter: "drop-shadow(0 0 6px rgba(6, 182, 212, 0.3))" }} />
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 900, letterSpacing: 2, background: 'linear-gradient(90deg, var(--accent2), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ASTRONOTE</span>
            </div>
            <div style={{ fontSize: 9, color: "var(--text2)", letterSpacing: 3, textTransform: "uppercase" }}>Panneau d'administration</div>
          </div>
          
          <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
            {[
              { id: "dashboard", ic: "📊", lb: "Dashboard" },
              { id: "actualites", ic: "📰", lb: "Actualités" },
              { id: "artistes", ic: "🎤", lb: "Artistes" },
              { id: "morceaux", ic: "🎵", lb: "Morceaux" },
              { id: "albums", ic: "💿", lb: "Albums" },
              { id: "evenements", ic: "🎪", lb: "Événements" },
              { id: "messages", ic: "✉️", lb: `Messages ${messagesNonLus > 0 ? `(${messagesNonLus})` : ''}` },
              { id: "ventes", ic: "💰", lb: "Ventes" },
              { id: "scanner", ic: "📷", lb: "Scanner" },
              { id: "analytics", ic: "📈", lb: "Analytics" },
            ].map(item => (
              <div 
                key={item.id} 
                onClick={() => { setVue(item.id); setArtEdit(null); setMorEdit(null); setArtForm(artInit); setMorForm(morInit); if (isMobile) setSidebarOpen(false); }}
                style={{ 
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all .2s",
                  background: vue === item.id ? "rgba(124,58,237,0.15)" : "transparent",
                  color: vue === item.id ? "var(--accent2)" : "var(--text2)",
                  borderLeft: `3px solid ${vue === item.id ? "var(--accent)" : "transparent" }`
                }}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{item.ic}</span>
                {item.lb}
              </div>
            ))}
          </nav>
          
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setConnecte(false);
              }} 
              style={{ 
                width: "100%", padding: "12px", background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: 10, 
                color: "var(--pink)", fontFamily: "'Exo 2',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s"
              }}
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>

        <div className="admin-content">
          {vue === "dashboard" && (
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: 3, marginBottom: 8 }} className="glow-text">DASHBOARD</div>
              <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 36 }}>Bienvenue dans le panneau d'administration ASTRONOTE.</div>
              <div className="admin-grid-4" style={{ marginBottom: 40 }}>
                {[
                  { ic: "🎤", lb: "Artistes signés", vl: artistes.length, c: "var(--accent2)" },
                  { ic: "🎵", lb: "Morceaux publiés", vl: morceaux.length, c: "var(--cyan)" },
                  { ic: "📊", lb: "Streams totaux", vl: artistes.reduce((s, a) => s + parseFloat(a.streams) || 0, 0).toFixed(1) + "M", c: "var(--gold)" },
                  { ic: "🌍", lb: "Plateformes", vl: "150+", c: "var(--pink)" },
                ].map(s => (
                  <div key={s.lb} className="glass-card admin-card-hover" style={{ padding: "24px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{s.ic}</div>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: s.c, marginBottom: 6 }}>{s.vl}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", letterSpacing: 1, textTransform: "uppercase" }}>{s.lb}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {vue === "actualites" && <ActualitesAdmin showToast={showToast} />}
          {vue === "ventes" && <VentesAdmin artistes={artistes} showToast={showToast} />}
          {vue === "analytics" && <AnalyticsDashboard />}
          {vue === "scanner" && <ScannerTickets />}
          {vue === "messages" && <MessagesAdmin />}
          {vue === "albums" && <AlbumsAdmin albums={albums} setAlbums={setAlbums} artistes={artistes} morceaux={morceaux} showToast={showToast} />}
          {vue === "evenements" && <EvenementsAdmin evenements={evenements} setEvenements={setEvenements} artistes={artistes} showToast={showToast} />}

          {vue === "artistes" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 3, marginBottom: 4 }} className="glow-text">ARTISTES</div>
                  <div style={{ color: "var(--text2)", fontSize: 13 }}>{artistes.length} artiste(s) dans le roster</div>
                </div>
                {artEdit && <button className="btn-outline" onClick={() => { setArtEdit(null); setArtForm(artInit); }}>✕ Annuler l'édition</button>}
              </div>
              <div className="admin-grid-2">
                <div className="glass-card" style={{ padding: "28px" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 3, color: "var(--accent2)", textTransform: "uppercase", marginBottom: 20 }}>
                    {artEdit ? "️ Modifier l'artiste" : "✦ Ajouter un artiste"}
                  </div>
                  <div className="admin-grid-2" style={{ gap: 12, marginBottom: 12 }}>
                    <div><label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Nom *</label><input className="admin-input" placeholder="NOVA X" value={artForm.nom} onChange={e => setArtForm({ ...artForm, nom: e.target.value })} /></div>
                    <div><label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Emoji avatar</label><input className="admin-input" placeholder="🎵" value={artForm.img} onChange={e => setArtForm({ ...artForm, img: e.target.value })} /></div>
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Téléphone (pour les paiements)</label>
                    <input className="admin-input" placeholder="+237 6XX XXX XXX" value={artForm.telephone} onChange={e => setArtForm({ ...artForm, telephone: e.target.value })} />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Image de l'artiste</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                      <label style={{ flex: 1, padding: "12px 14px", background: "rgba(124,58,237,0.08)", border: "1px dashed rgba(124,58,237,0.4)", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const file = e.target.files[0]; if (!file) return; setArtForm(f => ({ ...f, imgFile: file, imgPreview: URL.createObjectURL(file) })); }} />
                        <span style={{ fontSize: 20 }}>🖼️</span>
                        <span style={{ fontSize: 13, color: "var(--text2)" }}>{artForm.imgFile ? artForm.imgFile.name : "Choisir une image..."}</span>
                      </label>
                      {artForm.imgPreview && <img src={artForm.imgPreview} alt="Preview" style={{ width: 50, height: 50, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)" }} />}
                    </div>
                  </div>
                  <div className="admin-grid-2" style={{ gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Genre principal *</label>
                      <select className="admin-input" value={artForm.genre} onChange={e => setArtForm({ ...artForm, genre: e.target.value })}>
                        <option value="">Choisir...</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Genre secondaire</label>
                      <select className="admin-input" value={artForm.genre2} onChange={e => setArtForm({ ...artForm, genre2: e.target.value })}>
                        <option value="">Optionnel</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Pays</label>
                    <select className="admin-input" value={artForm.pays} onChange={e => setArtForm({ ...artForm, pays: e.target.value })}>
                      {PAYS_LIST_ADMIN.map(p => <option key={p.code} value={p.code}>{p.code} {p.nom}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Biographie *</label>
                    <textarea className="admin-input" style={{ minHeight: 90, resize: "vertical" }} placeholder="Décrivez l'artiste..." value={artForm.bio} onChange={e => setArtForm({ ...artForm, bio: e.target.value })} />
                  </div>
                  <div className="admin-grid-2" style={{ gap: 12, marginBottom: 20 }}>
                    <div><label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Streams (ex: 2.4M)</label><input className="admin-input" placeholder="0" value={artForm.streams} onChange={e => setArtForm({ ...artForm, streams: e.target.value })} /></div>
                    <div><label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Nb de titres</label><input className="admin-input" type="number" placeholder="0" value={artForm.tracks} onChange={e => setArtForm({ ...artForm, tracks: e.target.value })} /></div>
                  </div>
                  <button className="btn-primary" onClick={sauvegarderArtiste} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: "linear-gradient(135deg, var(--accent), var(--cyan))", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer" }}>
                    {artEdit ? "✏️ Enregistrer les modifications" : "✦ Ajouter au roster"}
                  </button>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "calc(100vh - 140px)", overflowY: "auto", paddingRight: 8 }}>
                  {artistes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed var(--border)" }}>
                      🎤 Aucun artiste pour le moment.
                    </div>
                  ) : artistes.map(a => (
                    <div key={a.id} className="glass-card admin-card-hover" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: a.img?.startsWith('http') ? 'transparent' : "linear-gradient(135deg,var(--accent),var(--cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, overflow: "hidden" }}>
                        {a.img?.startsWith('http') ? <img src={a.img} alt={a.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : a.img}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, marginBottom: 2 }}>{a.nom}</div>
                        <div style={{ fontSize: 12, color: "var(--accent2)", marginBottom: 2 }}>{a.genre}{a.genre2 ? ` / ${a.genre2}` : ""}</div>
                        <div style={{ fontSize: 11, color: "var(--text2)" }}>{a.pays} · {a.tracks} titres · {a.streams} streams</div>
                        {a.telephone && <div style={{ fontSize: 11, color: "var(--cyan)", marginTop: 2 }}>📞 {a.telephone}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button onClick={() => editerArtiste(a)} style={{ padding: "8px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, color: "var(--accent2)", fontSize: 14, cursor: "pointer" }}>✏️</button>
                        <button onClick={() => supprimerArtiste(a.id)} style={{ padding: "8px", background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: 8, color: "var(--pink)", fontSize: 14, cursor: "pointer" }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {vue === "morceaux" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 3, marginBottom: 4 }} className="glow-text">MORCEAUX</div>
                  <div style={{ color: "var(--text2)", fontSize: 13 }}>{morceaux.length} morceau(x) dans le catalogue</div>
                </div>
                {morEdit && <button className="btn-outline" onClick={() => { setMorEdit(null); setMorForm(morInit); }}>✕ Annuler l'édition</button>}
              </div>
              <div className="admin-grid-2">
                <div className="glass-card" style={{ padding: "28px" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 3, color: "var(--cyan)", textTransform: "uppercase", marginBottom: 20 }}>
                    {morEdit ? "✏️ Modifier le morceau" : " Ajouter un morceau"}
                  </div>
                  <div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Titre *</label><input className="admin-input" placeholder="Nom du morceau" value={morForm.titre} onChange={e => setMorForm({ ...morForm, titre: e.target.value })} /></div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Artiste *</label>
                    <select className="admin-input" value={morForm.artisteId} onChange={e => setMorForm({ ...morForm, artisteId: e.target.value })}>
                      <option value="">Choisir un artiste...</option>
                      {artistes.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                    </select>
                  </div>
                  <div className="admin-grid-2" style={{ gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Genre</label>
                      <select className="admin-input" value={morForm.genre} onChange={e => setMorForm({ ...morForm, genre: e.target.value })}>
                        <option value="">Choisir...</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div><label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Durée (ex: 3:42)</label><input className="admin-input" placeholder="3:42" value={morForm.duree} onChange={e => setMorForm({ ...morForm, duree: e.target.value })} /></div>
                  </div>
                  
                  <div className="admin-grid-2" style={{ gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Album / EP</label>
                      <select className="admin-input" value={morForm.album} onChange={e => {
                        const selectedAlbumTitle = e.target.value;
                        const selectedAlbum = (albums || []).find(a => a.titre === selectedAlbumTitle);
                        let newForm = { ...morForm, album: selectedAlbumTitle };
                        if (selectedAlbum && selectedAlbum.isPayant) {
                          newForm.payant = true;
                          newForm.prix = selectedAlbum.prix || '';
                          newForm.dureePaiement = selectedAlbum.dureeAcces ? String(selectedAlbum.dureeAcces) : "0";
                        } else {
                          newForm.payant = false;
                          newForm.prix = '';
                          newForm.dureePaiement = "7";
                        }
                        setMorForm(newForm);
                      }}>
                        <option value="">Aucun album (Morceau seul)</option>
                        {(albums || []).filter(a => !morForm.artisteId || a.artisteId === Number(morForm.artisteId)).map(a => (
                          <option key={a.id} value={a.titre}>{a.titre} ({a.annee}) {a.isPayant ? '🔒' : '🎧'}</option>
                        ))}
                      </select>
                    </div>
                    <div><label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Année</label><input className="admin-input" type="number" placeholder="2026" value={morForm.annee} onChange={e => setMorForm({ ...morForm, annee: e.target.value })} /></div>
                  </div>

                  <div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Streams</label><input className="admin-input" placeholder="ex: 450K" value={morForm.streams} onChange={e => setMorForm({ ...morForm, streams: e.target.value })} /></div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Fichier audio (MP3, WAV, OGG)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                      {/* ✅ 5. MISE À JOUR DU GESTIONNAIRE DE FICHIER AUDIO POUR STOCKER L'OBJET FILE */}
                      <label style={{ flex: 1, padding: "12px 14px", background: "rgba(6,182,212,0.08)", border: "1px dashed rgba(6,182,212,0.4)", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}>
                        <input type="file" accept="audio/*" style={{ display: "none" }} onChange={e => { 
                          const file = e.target.files[0]; 
                          if (!file) return; 
                          setMorForm(f => ({ 
                            ...f, 
                            fichier: file, // Stocke l'objet File réel pour l'upload
                            lien: URL.createObjectURL(file), 
                            fichierNom: file.name 
                          })); 
                        }} />
                        <span style={{ fontSize: 20 }}>🎵</span>
                        <span style={{ fontSize: 13, color: "var(--text2)" }}>{morForm.fichierNom || "Choisir un fichier audio..."}</span>
                      </label>
                      {morForm.fichier && (
                        <button onClick={() => setMorForm(f => ({ ...f, lien: "", fichier: null, fichierNom: "" }))} style={{ padding: "10px 12px", background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: 10, color: "var(--pink)", fontSize: 14, cursor: "pointer" }}>✕</button>
                      )}
                    </div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--text2)", textTransform: "uppercase", marginBottom: 12, fontWeight: 700 }}>Accès au morceau</div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                      <button onClick={() => setMorForm({ ...morForm, payant: false })} disabled={(albums || []).find(a => a.titre === morForm.album)?.isPayant}
                        style={{ flex: 1, padding: "10px", border: `2px solid ${!morForm.payant ? "#00e676" : "var(--border)"}`, borderRadius: 8, background: !morForm.payant ? "rgba(0,230,118,0.12)" : "transparent", color: !morForm.payant ? "#00e676" : "var(--text2)", fontFamily: "'Exo 2',sans-serif", fontWeight: 700, fontSize: 13, cursor: (albums || []).find(a => a.titre === morForm.album)?.isPayant ? "not-allowed" : "pointer", opacity: (albums || []).find(a => a.titre === morForm.album)?.isPayant ? 0.5 : 1, transition: "all 0.2s" }}>
                        🎧 Gratuit
                      </button>
                      <button onClick={() => setMorForm({ ...morForm, payant: true })}
                        style={{ flex: 1, padding: "10px", border: `2px solid ${morForm.payant ? "#f59e0b" : "var(--border)"}`, borderRadius: 8, background: morForm.payant ? "rgba(255,215,64,0.12)" : "transparent", color: morForm.payant ? "#f59e0b" : "var(--text2)", fontFamily: "'Exo 2',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                        🔒 Payant
                      </button>
                    </div>
                    {morForm.payant && (
                      <div className="admin-grid-2" style={{ gap: 12 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "var(--text2)", textTransform: "uppercase", marginBottom: 6 }}>Prix (FCFA)</label>
                          <input className="admin-input" type="number" placeholder="500" value={morForm.prix} onChange={e => setMorForm({ ...morForm, prix: e.target.value })} readOnly={(albums || []).find(a => a.titre === morForm.album)?.isPayant} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "var(--text2)", textTransform: "uppercase", marginBottom: 6 }}>Durée d'accès</label>
                          <select className="admin-input" value={morForm.dureePaiement} onChange={e => setMorForm({ ...morForm, dureePaiement: e.target.value })} disabled={(albums || []).find(a => a.titre === morForm.album)?.isPayant}>
                            <option value="1">1 jour</option>
                            <option value="3">3 jours</option>
                            <option value="7">7 jours</option>
                            <option value="14">14 jours</option>
                            <option value="30">30 jours</option>
                            <option value="0">Illimité</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button className="btn-primary" onClick={sauvegarderMorceau} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: "linear-gradient(135deg, var(--accent), var(--cyan))", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer" }}>
                    {morEdit ? "✏️ Enregistrer les modifications" : "🎵 Ajouter au catalogue"}
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "calc(100vh - 140px)", overflowY: "auto", paddingRight: 8 }}>
                  {morceaux.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed var(--border)" }}>
                      🎵 Aucun morceau. Ajoutez-en un !
                    </div>
                  ) : morceaux.map((m) => (
                    <div key={m.id} className="glass-card admin-card-hover" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg,rgba(6,182,212,0.2),rgba(124,58,237,0.2))", border: "1px solid rgba(6,182,212,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎵</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{m.titre}</div>
                        <div style={{ fontSize: 12, color: "var(--cyan)", marginBottom: 2 }}>{nomArtiste(m.artisteId)} {m.album ? `· ${m.album.titre}` : ""}</div>
                        <div style={{ fontSize: 11, color: "var(--text2)" }}>{m.genre} {m.duree ? `· ${m.duree}` : ""} {m.annee ? `· ${m.annee}` : ""} {m.isPayant ? '🔒' : '🎧'}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {m.audioUrl && m.audioUrl.startsWith("http") && <AudioPlayer src={m.audioUrl} />}
                        <button onClick={() => editerMorceau(m)} style={{ padding: "8px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, color: "var(--accent2)", fontSize: 14, cursor: "pointer" }}>✏️</button>
                        <button onClick={() => supprimerMorceau(m.id)} style={{ padding: "8px", background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: 8, color: "var(--pink)", fontSize: 14, cursor: "pointer" }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {toast && (
          <div style={{ 
            position: "fixed", bottom: 24, right: 24, zIndex: 999, 
            background: "rgba(8,11,24,0.98)", border: `1px solid ${toast.type === "error" ? "var(--pink)" : "var(--accent2)"}`, 
            borderRadius: 12, padding: "16px 24px", fontSize: 14, fontWeight: 600, 
            color: toast.type === "error" ? "var(--pink)" : "var(--accent2)", 
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)", animation: "fadeUp .3s ease",
            display: "flex", alignItems: "center", gap: 10
          }}>
            {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
          </div>
        )}
      </div>
    </>
  );
};

export default PageAdmin;