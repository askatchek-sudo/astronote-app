import { useState } from "react";
// ✅ MODIFICATION 1 : On importe aussi usersAPI pour l'inscription
import { authAPI, usersAPI } from "../lib/api";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [nom, setNom] = useState("");
  const [identifier, setIdentifier] = useState(""); // Pour login (email ou tel)
  const [email, setEmail] = useState(""); // Pour inscription
  const [telephone, setTelephone] = useState(""); // Pour inscription
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // ✅ Fonction de validation du mot de passe
  const validatePassword = (pwd) => {
    const checks = {
      length: pwd.length >= 6,
      uppercase: /[A-Z]/.test(pwd),
      number: /\d/.test(pwd)
    };
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  };

  const { checks, score } = validatePassword(password);

  const getStrengthLabel = () => {
    if (score === 0) return { text: "", color: "transparent" };
    if (score === 1) return { text: "Faible", color: "#ef4444" };
    if (score === 2) return { text: "Moyen", color: "#f59e0b" };
    return { text: "Fort", color: "#00e676" };
  };

  const strength = getStrengthLabel();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // === CONNEXION ===
        if (!identifier || !password) {
          throw new Error("Veuillez remplir tous les champs.");
        }
        
        const data = await authAPI.login(identifier, password);
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        window.dispatchEvent(new CustomEvent("fan-connected", { detail: data.user }));
        
        if (onLoginSuccess) onLoginSuccess(data.user);
        onClose();
        
      } else {
        // === INSCRIPTION ===
        if (!nom || !password) {
          throw new Error("Le nom et le mot de passe sont obligatoires.");
        }
        
        if (!email && !telephone) {
          throw new Error("Veuillez fournir au moins un email ou un numéro de téléphone.");
        }
        
        // Validation du mot de passe côté frontend
        if (password.length < 6) {
          throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        }
        if (!/[A-Z]/.test(password)) {
          throw new Error("Le mot de passe doit contenir au moins 1 majuscule.");
        }
        if (!/\d/.test(password)) {
          throw new Error("Le mot de passe doit contenir au moins 1 chiffre.");
        }

        // ✅ MODIFICATION 2 : On utilise usersAPI.register au lieu de authAPI.register
        const data = await usersAPI.register({ 
          nom, 
          email: email || null, 
          telephone: telephone || null, 
          password 
        });
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        window.dispatchEvent(new CustomEvent("fan-connected", { detail: data.user }));
        
        if (onLoginSuccess) onLoginSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", 
    background: "rgba(255,255,255,0.05)", 
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, 
    padding: "12px", 
    color: "var(--text)", 
    fontFamily: "'Exo 2', sans-serif",
    fontSize: 14, 
    outline: "none", 
    boxSizing: "border-box"
  };

  const labelStyle = { 
    display: "block", 
    fontSize: 11, 
    color: "var(--text2)", 
    letterSpacing: 2, 
    textTransform: "uppercase", 
    marginBottom: 6, 
    fontWeight: 600 
  };

  return (
    <div style={{ 
      position: "fixed", 
      inset: 0, 
      background: "rgba(0,0,0,0.85)", 
      backdropFilter: "blur(10px)", 
      zIndex: 2000, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: 20 
    }}>
      <div className="glass-card" style={{ 
        width: "100%", 
        maxWidth: 420, 
        padding: 32, 
        position: "relative", 
        animation: "fadeUp 0.3s ease both" 
      }}>
        <button 
          onClick={onClose} 
          style={{ 
            position: "absolute", 
            top: 16, 
            right: 16, 
            background: "none", 
            border: "none", 
            color: "var(--text2)", 
            fontSize: 24, 
            cursor: "pointer" 
          }}
        >
          ✕
        </button>
        
        <h2 style={{ 
          fontFamily: "'Orbitron',sans-serif", 
          fontSize: 22, 
          fontWeight: 900, 
          textAlign: "center", 
          marginBottom: 8, 
          background: "linear-gradient(90deg, var(--accent2), var(--cyan))", 
          WebkitBackgroundClip: "text", 
          WebkitTextFillColor: "transparent" 
        }}>
          {isLogin ? "Connexion" : "Créer un compte"}
        </h2>
        
        <p style={{ 
          textAlign: "center", 
          color: "var(--text2)", 
          fontSize: 13, 
          marginBottom: 24 
        }}>
          {isLogin ? "Heureux de vous revoir !" : "Rejoignez la galaxie ASTRONOTE"}
        </p>

        {error && (
          <div style={{ 
            background: "rgba(236,72,153,0.1)", 
            border: "1px solid rgba(236,72,153,0.3)", 
            borderRadius: 8, 
            padding: "10px 14px", 
            color: "var(--pink)", 
            fontSize: 13, 
            marginBottom: 16, 
            textAlign: "center" 
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Champ NOM (uniquement pour l'inscription) */}
          {!isLogin && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nom complet *</label>
              <input 
                type="text" 
                value={nom} 
                onChange={(e) => setNom(e.target.value)} 
                required 
                style={inputStyle} 
                placeholder="Votre nom" 
              />
            </div>
          )}

          {/* Champ IDENTIFIANT (pour login) ou EMAIL+TÉLÉPHONE (pour inscription) */}
          {isLogin ? (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email ou Téléphone *</label>
              <input 
                type="text" 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} 
                required 
                style={inputStyle} 
                placeholder="exemple@mail.com ou +237..." 
              />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email (optionnel)</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  style={inputStyle} 
                  placeholder="exemple@mail.com" 
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Numéro de téléphone (optionnel)</label>
                <input 
                  type="tel" 
                  value={telephone} 
                  onChange={(e) => setTelephone(e.target.value)} 
                  style={inputStyle} 
                  placeholder="+237 6XX XXX XXX" 
                />
                <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 4 }}>
                  ⚠️ Au moins l'email ou le téléphone est requis.
                </div>
              </div>
            </>
          )}

          {/* Champ MOT DE PASSE avec indicateur de force */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Mot de passe *</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={inputStyle} 
              placeholder="Minimum 6 caractères" 
            />
            
            {/* Indicateur de force (uniquement pour l'inscription) */}
            {!isLogin && password.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {/* Barres de progression */}
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  {[1, 2, 3].map((level) => (
                    <div 
                      key={level} 
                      style={{ 
                        flex: 1, 
                        height: 4, 
                        borderRadius: 2, 
                        background: score >= level ? strength.color : "rgba(255,255,255,0.1)",
                        transition: "background 0.3s"
                      }} 
                    />
                  ))}
                </div>
                
                {/* Texte de force */}
                <div style={{ fontSize: 11, color: strength.color, fontWeight: 600, marginBottom: 8 }}>
                  Force : {strength.text}
                </div>
                
                {/* Liste des critères */}
                <div style={{ fontSize: 11, color: "var(--text2)", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ color: checks.length ? "#00e676" : "var(--text2)" }}>
                    {checks.length ? "✅" : "⬜"} Au moins 6 caractères
                  </div>
                  <div style={{ color: checks.uppercase ? "#00e676" : "var(--text2)" }}>
                    {checks.uppercase ? "✅" : "⬜"} Au moins 1 majuscule (A-Z)
                  </div>
                  <div style={{ color: checks.number ? "#00e676" : "var(--text2)" }}>
                    {checks.number ? "✅" : "⬜"} Au moins 1 chiffre (0-9)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bouton de soumission */}
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading} 
            style={{ 
              width: "100%", 
              padding: "14px", 
              fontSize: 14, 
              fontWeight: 700, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 8, 
              cursor: loading ? "wait" : "pointer" 
            }}
          >
            {loading ? "⏳ Traitement..." : (isLogin ? "🔓 Se connecter" : "🚀 S'inscrire")}
          </button>
        </form>

        {/* Lien pour basculer entre connexion et inscription */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text2)" }}>
          {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <button 
            onClick={() => { 
              setIsLogin(!isLogin); 
              setError(""); 
              setPassword(""); 
            }} 
            style={{ 
              background: "none", 
              border: "none", 
              color: "var(--cyan)", 
              cursor: "pointer", 
              fontWeight: 600, 
              textDecoration: "underline" 
            }}
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}