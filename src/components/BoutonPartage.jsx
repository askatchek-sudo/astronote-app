import { useState } from 'react';

// ✅ Ajout de la prop 'icon' ici
const BoutonPartage = ({ titre, texte, url, type = "morceau", currentUser, onOpenLogin, icon }) => {
  const [ouvert, setOuvert] = useState(false);
  const [copie, setCopie] = useState(false);

  const textePartage = texte || 
    (type === "morceau" 
      ? `🎵 Écoute "${titre}" sur ASTRONOTE !` 
      : `🎟️ ${titre} - Rejoins-moi sur ASTRONOTE !`);
  
  const urlPartage = url || window.location.href;
  const urlEncodee = encodeURIComponent(urlPartage);
  const texteEncode = encodeURIComponent(textePartage);

  const supportePartageNatif = navigator.share;

  const liens = [
    { 
      nom: "WhatsApp", 
      icone: "💬", 
      couleur: "#25D366",
      url: `https://wa.me/?text=${texteEncode}%20${urlEncodee}`
    },
    { 
      nom: "Twitter / X", 
      icone: "🐦", 
      couleur: "#1DA1F2",
      url: `https://twitter.com/intent/tweet?text=${texteEncode}&url=${urlEncodee}&hashtags=ASTRONOTE,Music`
    },
    { 
      nom: "Facebook", 
      icone: "📘", 
      couleur: "#1877F2",
      url: `https://www.facebook.com/sharer/sharer.php?u=${urlEncodee}&quote=${texteEncode}`
    },
  ];

  const copierLien = async () => {
    try {
      await navigator.clipboard.writeText(urlPartage);
      setCopie(true);
      setTimeout(() => {
        setCopie(false);
        setOuvert(false);
      }, 1500);
    } catch (err) {
      console.error("Erreur copie:", err);
    }
  };

  const partagerNatif = async () => {
    try {
      await navigator.share({ title: titre, text: textePartage, url: urlPartage });
      setOuvert(false);
    } catch (err) {
      console.log("Partage annulé");
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    // ✅ VÉRIFICATION DE CONNEXION
    if (!currentUser) {
      if (onOpenLogin) onOpenLogin();
      return;
    }

    if (supportePartageNatif) {
      partagerNatif();
    } else {
      setOuvert(!ouvert);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleClick}
        style={{
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '50%', // ✅ Changé en rond
          width: 36,           // ✅ Taille fixe pour être un cercle parfait
          height: 36,
          padding: 0,          // ✅ Supprimé pour centrer l'icône
          color: 'var(--accent2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center', // ✅ Centrage parfait de l'icône
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
        title="Partager"
      >
        {/* ✅ Affiche l'icône SVG passée en prop, sinon l'emoji par défaut */}
        {icon || '📤'}
      </button>

      {ouvert && !supportePartageNatif && (
        <>
          <div onClick={() => setOuvert(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
            background: 'var(--bg-elevated, #1a1a2e)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 8, minWidth: 200, zIndex: 1000,
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)', animation: 'fadeUp 0.2s ease'
          }}>
            <div style={{ padding: '6px 12px', fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Partager via
            </div>
            {liens.map((lien) => (
              <a key={lien.nom} href={lien.url} target="_blank" rel="noopener noreferrer"
                onClick={() => setOuvert(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--text)', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 18 }}>{lien.icone}</span>
                <span>{lien.nom}</span>
              </a>
            ))}
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <button onClick={copierLien} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: copie ? 'var(--vert, #00e676)' : 'var(--text)', background: 'transparent', border: 'none', width: '100%', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 18 }}>{copie ? '✅' : '📋'}</span>
              <span>{copie ? 'Lien copié !' : 'Copier le lien'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BoutonPartage;