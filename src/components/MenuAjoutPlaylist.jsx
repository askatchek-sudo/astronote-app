import { useState, useEffect } from 'react';
import { playlistsAPI } from '../lib/api';

const MenuAjoutPlaylist = ({ morceauId, currentUser, onOpenLogin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Charger les playlists quand le menu s'ouvre
  useEffect(() => {
    if (isOpen && currentUser) {
      chargerPlaylists();
    }
  }, [isOpen, currentUser]);

  const chargerPlaylists = async () => {
    setLoading(true);
    try {
      const data = await playlistsAPI.get();
      setPlaylists(data);
    } catch (error) {
      console.error("Erreur chargement playlists", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (playlistId) => {
    try {
      await playlistsAPI.addMorceau(playlistId, morceauId);
      setMessage("✅ Ajouté !");
      setTimeout(() => {
        setMessage('');
        setIsOpen(false);
      }, 1500);
    } catch (error) {
      // Si l'erreur est "déjà dans la playlist", on l'affiche gentiment
      const msg = error.message.toLowerCase();
      if (msg.includes("unique") || msg.includes("déjà")) {
        setMessage("ℹ️ Déjà dans la playlist");
      } else {
        alert("Erreur : " + error.message);
      }
      setTimeout(() => {
        setMessage('');
        setIsOpen(false);
      }, 1500);
    }
  };

  // Si pas connecté, le bouton ouvre juste la modale
  if (!currentUser) {
    return (
      <button 
        onClick={() => onOpenLogin ? onOpenLogin() : alert("Connectez-vous pour ajouter à une playlist")}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, display: 'flex', alignItems: 'center' }}
        title="Ajouter à une playlist"
      >
        ➕
      </button>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, 
          transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' 
        }}
        title="Ajouter à une playlist"
      >
        {message ? <span style={{ fontSize: 14 }}>{message}</span> : '➕'}
      </button>

      {isOpen && !message && (
        <>
          {/* Overlay pour fermer au clic extérieur */}
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
          
          {/* Menu déroulant */}
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
            background: 'var(--bg-elevated, #1a1a2e)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 8, minWidth: 220, zIndex: 1000,
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)', animation: 'fadeUp 0.2s ease'
          }}>
            <div style={{ padding: '6px 12px', fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Ajouter à une playlist
            </div>
            
            {loading ? (
              <div style={{ padding: 12, textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>Chargement...</div>
            ) : playlists.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>
                Aucune playlist.<br/>Créez-en une dans "Mon Compte".
              </div>
            ) : (
              playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => handleAdd(pl.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 12px', borderRadius: 8, border: 'none',
                    background: 'transparent', color: 'var(--text)',
                    fontSize: 13, cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 16 }}>🎵</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.nom}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MenuAjoutPlaylist;