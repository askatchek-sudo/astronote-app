import { useEffect } from "react";

const Merci = ({ setPage, currentUser }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ 
      padding: "120px 20px 80px", 
      maxWidth: 600, 
      margin: "0 auto", 
      textAlign: "center",
      minHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{ 
        width: 80, height: 80, borderRadius: "50%", 
        background: "rgba(0, 230, 118, 0.1)", 
        border: "2px solid #00e676",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, marginBottom: 24,
        animation: "pulse 2s infinite"
      }}>
        ✅
      </div>
      
      <h1 style={{ 
        fontFamily: "'Orbitron', sans-serif", 
        fontSize: 32, 
        fontWeight: 900, 
        marginBottom: 16,
        background: "linear-gradient(90deg, #00e676, #06b6d4)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Paiement Réussi !
      </h1>
      
      <p style={{ color: "var(--text2)", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
        Merci pour votre achat sur ASTRONOTE. <br/>
        Votre album est maintenant débloqué et prêt à être écouté.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <button 
          onClick={() => setPage("accueil")}
          style={{
            padding: "14px 32px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            borderRadius: 50,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          🏠 Accueil
        </button>
        <button 
          onClick={() => setPage("musique")}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, var(--accent), var(--cyan))",
            border: "none",
            borderRadius: 50,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          🎵 Écouter maintenant
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(0, 230, 118, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0); }
        }
      `}</style>
    </div>
  );
};

export default Merci;