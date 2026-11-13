import { useState, useEffect } from 'react';
import { achatsAPI, favorisAPI, playlistsAPI, morceauxAPI } from '../lib/api';
import { generateTicketPDF } from "../utils/generateTicketPDF";
import BoutonPartage from '../components/BoutonPartage';
import { ShareIcon, DownloadIcon } from '../components/Icons';
import AudioVisualizer from '../components/AudioVisualizer';

// ✅ AJOUT : Variable d'environnement pour la production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  // ✅ CORRECTION : Utilise API_URL au lieu de localhost en dur
  if (img.startsWith("/uploads/")) return `${API_URL}${img}`;
  if (img.includes("/uploads/")) return `${API_URL}/${img.replace(/^\//, "")}`;
  return null;
};

const MonCompte = ({ setMorceauEnCours, morceauEnCours, setPage, setAlbumSelectionne, albums, morceaux, artistes }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [mesAchats, setMesAchats] = useState([]);
  const [mesTickets, setMesTickets] = useState([]);
  const [mesFavoris, setMesFavoris] = useState([]);
  const [mesPlaylists, setMesPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('morceaux');
  
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistNom, setNewPlaylistNom] = useState('');
  const [playlistOuverte, setPlaylistOuverte] = useState(null);
  const [telechargementEnCours, setTelechargementEnCours] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setCurrentUser(JSON.parse(userStr)); } catch (e) { setCurrentUser(null); }
    }
    const handleUserUpdated = (e) => {
      if (e.detail === null) { setCurrentUser(null); setMesAchats([]); setMesTickets([]); setMesFavoris([]); setMesPlaylists([]); } 
      else { setCurrentUser(e.detail); }
    };
    const handleFanConnected = (e) => {
      if (e.detail === null) { setCurrentUser(null); setMesAchats([]); setMesTickets([]); setMesFavoris([]); setMesPlaylists([]); } 
      else { setCurrentUser(e.detail); }
    };
    window.addEventListener('user-updated', handleUserUpdated);
    window.addEventListener('fan-connected', handleFanConnected);
    return () => {
      window.removeEventListener('user-updated', handleUserUpdated);
      window.removeEventListener('fan-connected', handleFanConnected);
    };
  }, []);

  useEffect(() => {
    if (currentUser) chargerDonnees();
    else setLoading(false);
  }, [currentUser]);

  const chargerDonnees = async () => {
    try {
      const [achats, tickets, favoris, playlists] = await Promise.all([
        achatsAPI.mesMorceaux(), achatsAPI.mesTickets(), favorisAPI.get(), playlistsAPI.get()
      ]);
      setMesAchats(achats); setMesTickets(tickets); setMesFavoris(favoris); setMesPlaylists(playlists);
    } catch (error) { console.error('Erreur chargement:', error); } 
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    // ✅ 1. Arrêter la musique et fermer le lecteur immédiatement
    if (setMorceauEnCours) {
      setMorceauEnCours(null);
    }

    // ✅ 2. Nettoyer le stockage local
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user-version');

    // ✅ 3. Réinitialiser l'état local du composant
    setCurrentUser(null);
    setMesAchats([]);
    setMesTickets([]);
    setMesFavoris([]);
    setMesPlaylists([]);

    // ✅ 4. Notifier les autres composants de la déconnexion
    window.dispatchEvent(new CustomEvent("fan-connected", { detail: null }));
    window.dispatchEvent(new CustomEvent("user-updated", { detail: null }));
    window.dispatchEvent(new CustomEvent("logout"));
    
    // ✅ 5. Mettre à jour le timestamp de version
    localStorage.setItem('user-version', Date.now().toString());
  };

  const creerPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistNom.trim()) return;
    try { await playlistsAPI.create({ nom: newPlaylistNom }); setNewPlaylistNom(''); setShowCreatePlaylist(false); chargerDonnees(); } 
    catch (error) { alert("Erreur : " + error.message); }
  };

  const supprimerPlaylist = async (id) => {
    if (!confirm("Supprimer cette playlist ?")) return;
    try { await playlistsAPI.delete(id); if (playlistOuverte === id) setPlaylistOuverte(null); chargerDonnees(); } 
    catch (error) { alert("Erreur : " + error.message); }
  };

  const retirerMorceau = async (playlistId, morceauId) => {
    try { await playlistsAPI.removeMorceau(playlistId, morceauId); chargerDonnees(); } 
    catch (error) { alert("Erreur : " + error.message); }
  };

  const lireMorceauSimple = (song) => {
    if (!song || !song.audioUrl) return;
    // ✅ CORRECTION : Utilise API_URL au lieu de localhost en dur
    setMorceauEnCours({ ...song, audioUrl: song.audioUrl.startsWith('http') ? song.audioUrl : `${API_URL}${song.audioUrl}`, playlist: null });
  };

  const lirePlaylist = (playlist, indexDepart = 0) => {
    if (!playlist || playlist.morceaux.length === 0) { alert("Playlist vide !"); return; }
    // ✅ CORRECTION : Utilise API_URL au lieu de localhost en dur
    const fileLecture = playlist.morceaux.map(pm => ({ ...pm.morceau, audioUrl: pm.morceau.audioUrl?.startsWith('http') ? pm.morceau.audioUrl : `${API_URL}${pm.morceau.audioUrl}` }));
    setMorceauEnCours({ ...fileLecture[indexDepart], playlist: { nom: playlist.nom, file: fileLecture, indexActuel: indexDepart, shuffle: false } });
  };

  const handleTelecharger = async (song) => {
    if (!song || !song.audioUrl) return;
    setTelechargementEnCours(song.id);
    try { await morceauxAPI.telecharger(song.id); } 
    catch (error) { alert("❌ " + error.message); } 
    finally { setTelechargementEnCours(null); }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const albumsAchetes = (albums || []).filter(a => mesAchats.some(achat => Number(achat.albumId) === Number(a.id) && achat.actif));

  const iconButtonStyle = (color, bgColor, borderColor, size = 36) => ({
    width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    background: bgColor, border: `1px solid ${borderColor}`, color: color, cursor: "pointer", transition: "all 0.2s", flexShrink: 0
  });

  if (!currentUser) {
    return (
      <div style={{ padding: "120px 40px 80px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
        <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, marginBottom: 16 }}>Accès réservé</h1>
        <p style={{ color: "var(--text2)" }}>Connectez-vous pour accéder à votre espace personnel.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "120px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
      
      {/* ✅ EN-TÊTE AMÉLIORÉ AVEC AVATAR ET BOUTON DÉCONNEXION STYLISÉ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48, flexWrap: "wrap", gap: 20, padding: "24px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
            👤
          </div>
          <div>
            <div className="section-tag" style={{ marginBottom: 4 }}>Mon Espace</div>
            <h1 className="section-title" style={{ margin: 0, fontSize: 28 }}>Bonjour, <span className="glow-text">{currentUser.nom || currentUser.email}</span></h1>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ padding: "12px 28px", background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.4)", borderRadius: 50, color: "var(--pink)", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(236,72,153,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(236,72,153,0.2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(236,72,153,0.1)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          🚪 Déconnexion
        </button>
      </div>

      {/* ✅ ONGLETS AVEC EFFETS DE SURVOL AMÉLIORÉS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { id: 'morceaux', label: `🎵 Mes Morceaux (${mesAchats.filter(a => a.morceau).length})`, color: 'var(--cyan)' },
          { id: 'tickets', label: `🎟 Mes Tickets (${mesTickets.length})`, color: 'var(--pink)' },
          { id: 'favoris', label: `❤️ Mes Favoris (${mesFavoris.length})`, color: 'var(--pink)' },
          { id: 'playlists', label: `🎧 Mes Playlists (${mesPlaylists.length})`, color: 'var(--accent2)' },
          { id: 'albums', label: `💿 Mes Albums (${albumsAchetes.length})`, color: 'var(--accent2)' }
        ].map((t) => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)} 
            style={{ 
              padding: '12px 24px', 
              background: tab === t.id ? `${t.color}26` : 'transparent', 
              border: `1px solid ${tab === t.id ? t.color : 'var(--border)'}`, 
              borderRadius: 50, 
              color: tab === t.id ? t.color : 'var(--text2)', 
              cursor: 'pointer', 
              fontSize: 13, 
              fontWeight: 600, 
              transition: 'all 0.2s ease' 
            }}
            onMouseEnter={(e) => { if (tab !== t.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
            onMouseLeave={(e) => { if (tab !== t.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; } }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Chargement de vos données...</div> : (
        <>
          {/* 1. ONGLET MORCEAUX ACHETÉS */}
          {tab === 'morceaux' && (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              {mesAchats.filter(a => a.morceau).length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>Aucun achat de morceau.</div> : 
                mesAchats.filter(a => a.morceau).map((a, i) => {
                  const song = a.morceau;
                  const estEnCours = morceauEnCours && song && Number(morceauEnCours.id) === Number(song.id);
                  
                  return (
                    <div 
                      key={a.id} 
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < mesAchats.filter(x => x.morceau).length - 1 ? '1px solid var(--border)' : 'none', background: estEnCours ? 'rgba(6, 182, 212, 0.05)' : 'transparent', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => { if (!estEnCours) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { if (!estEnCours) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                        {estEnCours ? <AudioVisualizer key={`viz-${song.id}`} isPlaying={true} color="var(--cyan)" /> : <div style={{ fontSize: 20 }}>🎵</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: estEnCours ? "var(--cyan)" : "var(--text)" }}>{song.titre}</div>
                        <div style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 2 }}>{song.artiste?.nom || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative', zIndex: 10 }}>
                        {song.audioUrl && <button onClick={() => lireMorceauSimple(song)} style={iconButtonStyle(estEnCours ? "#fff" : "var(--cyan)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.1)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.3)")}>{estEnCours ? "⏸" : "▶"}</button>}
                        {song.audioUrl && <button onClick={() => handleTelecharger(song)} disabled={telechargementEnCours === song.id} style={{ ...iconButtonStyle("var(--vert)", "rgba(0,230,118,0.1)", "rgba(0,230,118,0.3)"), opacity: telechargementEnCours === song.id ? 0.6 : 1 }}>{telechargementEnCours === song.id ? "⏳" : <DownloadIcon size={16} />}</button>}
                        <BoutonPartage titre={song.titre} texte={`🎵 J'écoute "${song.titre}" !`} url={`${window.location.origin}/musique?morceau=${song.id}`} type="morceau" currentUser={currentUser} icon={<ShareIcon size={16} />} />
                      </div>
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* 2. ONGLET TICKETS */}
          {tab === 'tickets' && (
            <div>
              {mesTickets.length === 0 ? <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎟</div><div style={{ color: 'var(--text2)' }}>Aucun ticket acheté.</div></div> : 
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(350px,1fr))', gap: 20 }}>
                  {mesTickets.map(t => (
                    <div key={t.id} className="glass-card" style={{ padding: 24, border: '1px solid rgba(236,72,153,0.3)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(236,72,153,0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{t.evenement.titre}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>{formatDate(t.evenement.date)} à {t.evenement.heure}</div>
                      <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, marginBottom: 16, textAlign: 'center', border: '1px dashed rgba(236,72,153,0.3)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text2)', letterSpacing: 2, marginBottom: 4 }}>CODE D'ENTRÉE</div>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 16, fontWeight: 700, color: 'var(--pink)', letterSpacing: 2 }}>{t.codeUnique}</div>
                      </div>
                      <button onClick={() => generateTicketPDF(t)} style={{ width: "100%", padding: "12px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: 8, color: "var(--cyan)", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: 'all 0.2s', display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(6,182,212,0.2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(6,182,212,0.1)"; }}
                      >
                        <DownloadIcon size={16} /> Télécharger le PDF
                      </button>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* 3. ONGLET FAVORIS */}
          {tab === 'favoris' && (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              {mesFavoris.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: 'var(--text2)' }}>Aucun favori pour le moment.</div> : 
                mesFavoris.map((m, i) => {
                  const song = m.morceau || m; 
                  const estEnCours = morceauEnCours && song && Number(morceauEnCours.id) === Number(song.id);
                  
                  return (
                    <div 
                      key={m.id} 
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < mesFavoris.length - 1 ? '1px solid var(--border)' : 'none', background: estEnCours ? 'rgba(6, 182, 212, 0.05)' : 'transparent', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => { if (!estEnCours) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { if (!estEnCours) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                        {estEnCours ? <AudioVisualizer key={`viz-${song.id}`} isPlaying={true} color="var(--cyan)" /> : <div style={{ fontSize: 20 }}>🎵</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: estEnCours ? "var(--cyan)" : "var(--text)" }}>{song.titre}</div>
                        <div style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 2 }}>{song.artiste?.nom || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative', zIndex: 10 }}>
                        {song.audioUrl && <button onClick={() => lireMorceauSimple(song)} style={iconButtonStyle(estEnCours ? "#fff" : "var(--cyan)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.1)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.3)")}>{estEnCours ? "⏸" : "▶"}</button>}
                        {song.audioUrl && <button onClick={() => handleTelecharger(song)} disabled={telechargementEnCours === song.id} style={{ ...iconButtonStyle("var(--vert)", "rgba(0,230,118,0.1)", "rgba(0,230,118,0.3)"), opacity: telechargementEnCours === song.id ? 0.6 : 1 }}>{telechargementEnCours === song.id ? "⏳" : <DownloadIcon size={16} />}</button>}
                        <BoutonPartage titre={song.titre} texte={`🎵 J'écoute "${song.titre}" !`} url={`${window.location.origin}/musique?morceau=${song.id}`} type="morceau" currentUser={currentUser} icon={<ShareIcon size={16} />} />
                      </div>
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* 4. ONGLET PLAYLISTS */}
          {tab === 'playlists' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700 }}>Vos Collections</h3>
                <button onClick={() => setShowCreatePlaylist(true)} style={{ padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  ➕ Nouvelle Playlist
                </button>
              </div>
              {mesPlaylists.length === 0 ? <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16 }}>🎧</div><div style={{ color: 'var(--text2)' }}>Aucune playlist créée.</div></div> : 
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {mesPlaylists.map(pl => (
                    <div key={pl.id} className="glass-card" style={{ padding: 20, position: 'relative', transition: 'transform 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <button onClick={() => supprimerPlaylist(pl.id)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(236,72,153,0.1)', border: 'none', color: 'var(--pink)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; }}
                      >🗑</button>
                      <div style={{ width: '100%', aspectRatio: '1/1', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>🎵</div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{pl.nom}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>{pl.morceaux.length} morceau(x)</div>
                      {pl.morceaux.length > 0 && <button onClick={() => lirePlaylist(pl, 0)} style={{ width: '100%', padding: '12px', marginBottom: 16, background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(124,58,237,0.2))', border: '1px solid rgba(6,182,212,0.4)', borderRadius: 50, color: 'var(--cyan)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }} 
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(124,58,237,0.3))'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(124,58,237,0.2))'; }}
                      >▶ Lire toute la playlist</button>}
                      <button onClick={() => setPlaylistOuverte(playlistOuverte === pl.id ? null : pl.id)} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 12, transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
                      >{playlistOuverte === pl.id ? '▲ Masquer' : '▼ Voir les morceaux'}</button>
                      {playlistOuverte === pl.id && (
                        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                          {pl.morceaux.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--text2)', fontSize: 12 }}>Playlist vide.</div> : 
                            pl.morceaux.map((pm, idx) => {
                              const song = pm.morceau;
                              const estEnCours = morceauEnCours && song && Number(morceauEnCours.id) === Number(song.id);
                              
                              return (
                                <div key={pm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12, gap: 12, background: estEnCours ? 'rgba(6, 182, 212, 0.05)' : 'transparent', transition: 'background 0.2s' }}
                                  onMouseEnter={(e) => { if (!estEnCours) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                  onMouseLeave={(e) => { if (!estEnCours) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                                    <div style={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                      {estEnCours ? <AudioVisualizer key={`viz-${song.id}`} isPlaying={true} color="var(--cyan)" /> : <span style={{ color: 'var(--text2)', fontFamily: "'Space Mono',monospace", fontSize: 11 }}>{idx + 1}.</span>}
                                    </div>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: estEnCours ? "var(--cyan)" : "var(--text)" }}>{song.titre}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, position: 'relative', zIndex: 10 }}>
                                    {song.audioUrl && <button onClick={() => lirePlaylist(pl, idx)} style={iconButtonStyle(estEnCours ? "#fff" : "var(--cyan)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.1)", estEnCours ? "var(--cyan)" : "rgba(6,182,212,0.3)", 32)}>{estEnCours ? "⏸" : "▶"}</button>}
                                    <button onClick={() => retirerMorceau(pl.id, song.id)} style={iconButtonStyle("var(--pink)", "rgba(236,72,153,0.1)", "rgba(236,72,153,0.3)", 32)}>✕</button>
                                  </div>
                                </div>
                              );
                            })
                          }
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* 5. ONGLET ALBUMS ACHETÉS */}
          {tab === 'albums' && (
            <div>
              {albumsAchetes.length === 0 ? <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 16 }}>💿</div><div style={{ color: 'var(--text2)', marginBottom: 20 }}>Aucun album acheté.</div><button className="btn-primary" onClick={() => setPage('musique')} style={{ marginTop: 0 }}>🎵 Découvrir la musique</button></div> : 
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                  {albumsAchetes.map(a => {
                    const coverUrl = getImageUrl(a.coverUrl);
                    const artisteNom = artistes?.find(art => art.id === Number(a.artisteId))?.nom || 'Artiste';
                    return (
                      <div key={a.id} className="glass-card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => { if (typeof setAlbumSelectionne === 'function') setAlbumSelectionne(a.id); setPage('album-detail'); window.scrollTo(0, 0); }} 
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(124, 58, 237, 0.3)'; }} 
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ aspectRatio: '1', background: coverUrl ? '#1a1a2e' : 'linear-gradient(135deg,var(--accent),var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          {coverUrl ? <img src={coverUrl} alt={a.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 64 }}>{a.coverEmoji || '💿'}</span>}
                          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0, 230, 118, 0.9)', color: '#000', fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>✅ ACHETÉ</div>
                        </div>
                        <div style={{ padding: 16 }}>
                          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titre}</div>
                          <div style={{ fontSize: 12, color: 'var(--accent2)' }}>{artisteNom}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{a.annee} · {a.genre || 'Musique'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          )}
        </>
      )}

      {showCreatePlaylist && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass-card" style={{ maxWidth: 400, width: '100%', padding: 32, border: '1px solid rgba(124,58,237,0.3)' }}>
            <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, marginBottom: 20 }}>Créer une playlist</h3>
            <form onSubmit={creerPlaylist}>
              <input type="text" placeholder="Nom de la playlist (ex: Afrobeat 2024)" value={newPlaylistNom} onChange={(e) => setNewPlaylistNom(e.target.value)} required style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, marginBottom: 20, outline: 'none', transition: 'border 0.2s' }} 
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => { setShowCreatePlaylist(false); setNewPlaylistNom(''); }} className="btn-outline" style={{ flex: 1 }}>Annuler</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonCompte;