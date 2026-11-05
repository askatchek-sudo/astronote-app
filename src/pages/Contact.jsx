import { useState } from "react";
import { messagesAPI } from '../lib/api';

const Contact = () => {
  const [form, setForm] = useState({ nom: "", email: "", tel: "", genre: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(false); 

  const envoyer = async () => {
    if (!form.nom || !form.email || !form.message) return;
    
    setLoading(true);
    setError(false);

    try {
      const sujet = form.genre ? `Projet musical : ${form.genre}` : "Demande de contact";
      const messageComplet = form.message + (form.tel ? `\n\nTéléphone : ${form.tel}` : "");

      await messagesAPI.send({
        nom: form.nom,
        email: form.email,
        sujet: sujet,
        message: messageComplet
      });
      
      setSent(true);
      setForm({ nom: "", email: "", tel: "", genre: "", message: "" });
    } catch (err) {
      console.error("❌ Erreur d'envoi :", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center"
    }}>
      <div style={{ fontSize: 80, marginBottom: 24, animation: "float 3s ease-in-out infinite" }}>✦</div>
      <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 900, marginBottom: 16 }} className="glow-text">
        Message envoyé !
      </h2>
      <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 480, lineHeight: 1.7 }}>
        Merci pour votre message. Notre équipe reviendra vers vous dans les 7 jours ouvrés. Les étoiles s'alignent pour vous ✦
      </p>
      <button className="btn-outline" onClick={() => setSent(false)} style={{ marginTop: 32, width: "100%", maxWidth: 300 }}>
        ← Envoyer un autre message
      </button>
    </div>
  );

  return (
    <>
      {/* ✅ CSS RESPONSIVE POUR LA PAGE CONTACT */}
      <style>{`
        .contact-page { padding: 100px 16px 60px !important; }
        .contact-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        .form-grid { grid-template-columns: 1fr !important; }
        .contact-card { padding: 24px !important; }
        
        @media (min-width: 768px) {
          .contact-page { padding: 120px 40px 80px !important; }
          .contact-grid { grid-template-columns: 1fr 1fr !important; gap: 40px !important; }
          .form-grid { grid-template-columns: 1fr 1fr !important; }
          .contact-card { padding: 32px !important; }
        }
      `}</style>

      <div className="contact-page" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="section-tag">Contact</div>
          <h1 className="section-title">Rejoignez <span className="glow-text">l'univers</span></h1>
          <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 500, margin: "16px auto 0" }}>
            Vous êtes artiste, manager ou partenaire ? Entrons en contact.
          </p>
        </div>

        <div className="contact-grid" style={{ display: "grid" }}>
          
          {/* COLONNE GAUCHE : INFOS */}
          <div>
            <div className="glass-card contact-card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>
                NOUS TROUVER
              </h3>
              {[
                ["📍", "Adresse", "Ebwa en face crystal, Ebolowa, Cameroun"],
                ["📞", "Téléphone", "+237 07 00 00 00 00"],
                ["✉️", "Email", "contact@astronote.music"],
                ["🕐", "Horaires", "Lun–Ven : 9h–18h (GMT)"],
              ].map(([ic, lb, vl]) => (
                <div key={lb} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0
                  }}>
                    {ic}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>
                      {lb}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-word" }}>{vl}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card contact-card">
              <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
                RÉSEAUX SOCIAUX
              </h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["Instagram", "Twitter / X", "YouTube", "SoundCloud", "TikTok"].map(r => (
                  <span
                    key={r}
                    style={{
                      padding: "8px 16px", background: "var(--surface, rgba(255,255,255,0.03))",
                      border: "1px solid var(--border)", borderRadius: 50,
                      fontSize: 12, color: "var(--text2)", cursor: "pointer", transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : FORMULAIRE */}
          <div className="glass-card contact-card" style={{ padding: "32px" }}>
            <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
              ENVOYER UN MESSAGE
            </h3>
            
            <div className="form-grid" style={{ display: "grid", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                  Nom *
                </label>
                <input
                  className="input-field"
                  placeholder="Votre nom"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                  Email *
                </label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                Téléphone
              </label>
              <input
                className="input-field"
                placeholder="+237 07 00 00 00 00"
                value={form.tel}
                onChange={e => setForm({ ...form, tel: e.target.value })}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                Genre musical
              </label>
              <input
                className="input-field"
                placeholder="Afrobeat, R&B, Hip-Hop..."
                value={form.genre}
                onChange={e => setForm({ ...form, genre: e.target.value })}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                Message *
              </label>
              <textarea
                className="input-field"
                placeholder="Parlez-nous de votre projet musical..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                rows={5}
                style={{ width: "100%", resize: "vertical", minHeight: "120px" }}
              />
            </div>

            <button
              className="btn-primary"
              onClick={envoyer}
              disabled={!form.nom || !form.email || !form.message || loading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "16px",
                border: "none",
                borderRadius: 50,
                cursor: (!form.nom || !form.email || !form.message || loading) ? "not-allowed" : "pointer",
                background: (!form.nom || !form.email || !form.message)
                  ? "rgba(124,58,237,0.3)"
                  : "linear-gradient(135deg,var(--accent),var(--cyan))",
                color: "#fff",
                fontFamily: "'Orbitron',sans-serif",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                opacity: (!form.nom || !form.email || !form.message) ? 0.5 : 1,
                transition: "all 0.2s"
              }}>
              {loading ? "⏳ ENVOI EN COURS..." : "✦ ENVOYER MON DOSSIER"}
            </button>

            {error && (
              <div style={{ marginTop: 16, color: "var(--pink)", fontSize: 13, textAlign: "center", padding: "12px", background: "rgba(236,72,153,0.1)", borderRadius: 8 }}>
                ⚠ Une erreur est survenue. Veuillez vérifier votre connexion et réessayer.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;