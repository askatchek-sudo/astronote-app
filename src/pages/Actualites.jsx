import { useState } from "react";
import { ACTUALITES } from "../data/initialData";

const Actualites = () => {
  const [sel, setSel] = useState(null);
  const cats = ["Tous", ...new Set(ACTUALITES.map(a => a.cat))];
  const [filtre, setFiltre] = useState("Tous");
  const liste = filtre === "Tous" ? ACTUALITES : ACTUALITES.filter(a => a.cat === filtre);
  const catColors = {
    Signature: "var(--gold)",
    Chart: "var(--cyan)",
    Programme: "var(--accent2)",
    Tournée: "var(--pink)",
    Anniversaire: "var(--gold)"
  };

  return (
    <div style={{ padding: "120px 40px 80px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div className="section-tag">News</div>
        <h1 className="section-title">Actualités <span className="glow-text">du label</span></h1>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setFiltre(c)}
            style={{
              padding: "8px 20px",
              border: `1px solid ${filtre === c ? "var(--accent2)" : "var(--border)"}`,
              borderRadius: 50,
              background: filtre === c ? "rgba(168,85,247,.15)" : "transparent",
              color: filtre === c ? "var(--accent2)" : "var(--text2)",
              fontFamily: "'Exo 2',sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all .2s"
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {liste.map((a, i) => (
          <div
            key={a.id}
            className="glass-card"
            style={{
              padding: "28px 32px", cursor: "pointer", display: "flex", gap: 24,
              alignItems: "flex-start", animation: `fadeUp 0.5s ${i * 0.07}s ease both`
            }}
            onClick={() => setSel(a)}
          >
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>
                {a.date.split(" ")[0]}
              </div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, color: "var(--accent2)" }}>
                {a.date.split(" ")[1]}
              </div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "var(--text2)" }}>
                {a.date.split(" ")[2]}
              </div>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{
                display: "inline-block", padding: "3px 10px", borderRadius: 20,
                background: `rgba(0,0,0,.4)`, border: `1px solid ${catColors[a.cat] || "var(--border)"}`,
                color: catColors[a.cat] || "var(--text2)", fontSize: 11, fontWeight: 700,
                letterSpacing: 1, textTransform: "uppercase", marginBottom: 10
              }}>
                {a.cat}
              </div>
              <h3 style={{
                fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700,
                letterSpacing: 1, marginBottom: 8, lineHeight: 1.4
              }}>
                {a.titre}
              </h3>
              <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6 }}>{a.desc}</p>
            </div>
            <div style={{ color: "var(--accent2)", fontSize: 20, flexShrink: 0 }}>→</div>
          </div>
        ))}
      </div>

      {sel && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(2,3,10,0.92)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            animation: "fadeIn .2s ease"
          }}
          onClick={() => setSel(null)}
        >
          <div
            className="glass-card"
            style={{ maxWidth: 560, width: "100%", padding: 36, animation: "fadeUp .3s ease" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: "inline-block", padding: "4px 12px", borderRadius: 20,
              border: `1px solid ${catColors[sel.cat] || "var(--border)"}`,
              color: catColors[sel.cat], fontSize: 11, fontWeight: 700,
              letterSpacing: 1, textTransform: "uppercase", marginBottom: 16
            }}>
              {sel.cat}
            </div>
            <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>
              {sel.titre}
            </h2>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: "var(--text2)", marginBottom: 20 }}>
              {sel.date}
            </div>
            <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: 24, fontSize: 15 }}>
              {sel.desc}
            </p>
            <button className="btn-outline" onClick={() => setSel(null)} style={{ width: "100%", justifyContent: "center" }}>
              ✕ Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actualites;