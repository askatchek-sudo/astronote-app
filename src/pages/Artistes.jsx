// ✅ AJOUT : Variable d'environnement pour la production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Artistes = ({ artistes, setPage, setArtisteSelectionne }) => {
  
  // ✅ FONCTION ROBUSTE : Gère Cloudinary, les uploads locaux et les emojis
  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http://') || img.startsWith('https://')) return img; // Cloudinary ou URL externe
    // ✅ CORRECTION : Utilise API_URL au lieu de localhost en dur
    if (img.startsWith('/uploads/')) return `${API_URL}${img}`; // Ancien chemin local
    if (img.includes('/uploads/')) return `${API_URL}/${img.replace(/^\//, '')}`;
    return null; // Ce n'est pas une URL, c'est un emoji ou du texte
  };

  const handleClick = (a) => {
    console.log("🎯 1. Clic détecté sur l'artiste :", a.nom);
    console.log("📦 2. setPage est-il une fonction ?", typeof setPage);
    console.log("📦 3. setArtisteSelectionne est-il une fonction ?", typeof setArtisteSelectionne);
    
    if (typeof setArtisteSelectionne === 'function') {
      console.log("✅ 4. setArtisteSelectionne appelé avec l'ID :", a.id);
      setArtisteSelectionne(a.id);
    } else {
      console.error("❌ ERREUR : setArtisteSelectionne n'est pas une fonction !");
    }

    if (typeof setPage === 'function') {
      console.log("✅ 5. setPage appelé avec 'artiste-detail'");
      setPage("artiste-detail");
    } else {
      console.error("❌ ERREUR : setPage n'est pas une fonction !");
    }
    
    window.scrollTo(0, 0);
  };

  return (
    <div style={{ padding: "120px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <div className="section-tag">Roster</div>
        <h1 className="section-title">Nos <span className="glow-text">Artistes</span></h1>
        <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
          {artistes.length} artiste(s) d'exception, un seul label pour les propulser.
        </p>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
        {artistes.map((a, i) => {
          // On détermine si c'est une vraie image ou un emoji
          const imageUrl = getImageUrl(a.img);
          const isImage = imageUrl !== null;

          return (
            <div
              key={a.id}
              className="glass-card"
              style={{ padding: "28px", cursor: "pointer", animation: `fadeUp 0.6s ${i * 0.08}s ease both`, transition: "transform 0.2s" }}
              onClick={() => handleClick(a)}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-6px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                {/* ✅ CONTENEUR DE L'IMAGE/EMOJI CORRIGÉ */}
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: isImage ? '#1a1a2e' : `linear-gradient(135deg,var(--accent),var(--${i % 2 === 0 ? "cyan" : "pink"}))`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0,
                  boxShadow: "0 0 20px var(--glow-v)", overflow: "hidden"
                }}>
                  {isImage ? (
                    <img 
                      src={imageUrl} 
                      alt={a.nom} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        // Si l'image ne charge pas, on affiche l'emoji ou la première lettre du nom
                        e.target.style.display = 'none';
                        e.target.parentElement.innerText = a.img || a.nom.charAt(0);
                      }}
                    />
                  ) : (
                    <span style={{ lineHeight: 1 }}>{a.img || "🎵"}</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 2 }}>
                    {a.nom}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--accent2)", marginTop: 2 }}>{a.genre}</div>
                  <div style={{ fontSize: 14, marginTop: 2 }}>{a.pays}</div>
                </div>
              </div>
              
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: 16 }}>
                {a.bio.length > 120 ? a.bio.substring(0, 120) + "..." : a.bio}
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["🎵", "Titres", a.tracks], ["📊", "Streams", a.streams]].map(([ic, lb, vl]) => (
                  <div key={lb} style={{ background: "rgba(0,0,0,.3)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{ic}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 14, color: "var(--cyan)", fontWeight: 700 }}>{vl}</div>
                    <div style={{ fontSize: 10, color: "var(--text2)", letterSpacing: 1, textTransform: "uppercase" }}>{lb}</div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "var(--accent2)", fontWeight: 600 }}>
                Voir la fiche complète →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Artistes;