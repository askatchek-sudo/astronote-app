import { SERVICES } from "../data/initialData";

const Distribution = ({ setPage }) => (
  <div style={{ padding: "120px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 64 }}>
      <div className="section-tag">Services</div>
      <h1 className="section-title">Distribution & <span className="glow-text">Services</span></h1>
      <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
        Tout ce dont vous avez besoin pour propulser votre carrière musicale vers les étoiles.
      </p>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20, marginBottom: 64 }}>
      {SERVICES.map((s, i) => (
        <div key={i} className="glass-card" style={{ padding: "32px", animation: `fadeUp 0.6s ${i * 0.08}s ease both` }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, marginBottom: 18
          }}>
            {s.ic}
          </div>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
            {s.titre}
          </h3>
          <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
        </div>
      ))}
    </div>

    <div style={{ marginBottom: 64 }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div className="section-tag">Comment ça marche</div>
        <h2 className="section-title">Le processus <span className="glow-text">ASTRONOTE</span></h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
        {[
          { n: "01", titre: "Soumission", desc: "Envoyez votre dossier artiste et vos maquettes via notre formulaire de contact." },
          { n: "02", titre: "Évaluation", desc: "Notre équipe artistique analyse votre projet sous 7 jours ouvrés." },
          { n: "03", titre: "Contrat", desc: "Si votre profil correspond, nous définissons ensemble les termes du partenariat." },
          { n: "04", titre: "Lancement", desc: "Production, distribution et promotion — nous propulsons votre musique dans l'univers." },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: "28px", textAlign: "center", animation: `fadeUp 0.6s ${i * 0.1}s ease both` }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 40, fontWeight: 900, color: "rgba(124,58,237,0.3)", marginBottom: 12 }}>
              {s.n}
            </div>
            <h3 style={{
              fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700,
              letterSpacing: 1, marginBottom: 10, color: "var(--accent2)"
            }}>
              {s.titre}
            </h3>
            <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>

    <div style={{ textAlign: "center", marginBottom: 40 }}>
      <div className="section-tag">Partenaires</div>
      <h2 className="section-title">150+ <span className="glow-text">plateformes</span></h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 24 }}>
        {["Spotify", "Apple Music", "Deezer", "Tidal", "YouTube Music", "Amazon Music", "SoundCloud", "Boomplay", "Audiomack", "Anghami", "Shazam", "TikTok"].map(p => (
          <span
            key={p}
            style={{
              padding: "8px 18px", background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: 50,
              fontSize: 13, color: "var(--text2)", fontWeight: 500
            }}
          >
            {p}
          </span>
        ))}
        <span style={{
          padding: "8px 18px", background: "rgba(124,58,237,0.15)",
          border: "1px solid rgba(124,58,237,0.3)", borderRadius: 50,
          fontSize: 13, color: "var(--accent2)", fontWeight: 600
        }}>
          +138 autres →
        </span>
      </div>
    </div>

    <div style={{ textAlign: "center", marginTop: 48 }}>
      <button className="btn-primary" onClick={() => setPage("contact")} style={{ fontSize: 14, padding: "16px 40px" }}>
        ✦ Soumettre mon projet
      </button>
    </div>
  </div>
);

export default Distribution;