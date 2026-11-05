import { useState } from "react";

const PlaylistCard = ({ playlist, morceaux, artistes, onPlay, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  
  const totalDuration = playlist.morceaux.reduce((acc, id) => {
    const m = morceaux.find(x => x.id === id);
    if (!m || !m.duree) return acc;
    const [min, sec] = m.duree.split(":").map(Number);
    return acc + min * 60 + sec;
  }, 0);
  
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-card" style={{ padding: 20, animation: "fadeUp 0.5s ease" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{
          width: 80, height: 80, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg,var(--accent),var(--cyan))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, boxShadow: "0 0 20px var(--glow-v)"
        }}>
          {playlist.cover}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700,
            letterSpacing: 1, marginBottom: 4
          }}>
            {playlist.nom}
          </h3>
          <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
            {playlist.desc}
          </p>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text2)" }}>
            <span>🎵 {playlist.morceaux.length} titres</span>
            <span>⏱ {formatDuration(totalDuration)}</span>
            <span>📅 {playlist.creeLe}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: 8,
            color: "var(--accent2)",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          {playlist.morceaux.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--text2)", fontSize: 13 }}>
              Playlist vide
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {playlist.morceaux.map((id, idx) => {
                const m = morceaux.find(x => x.id === id);
                if (!m) return null;
                const artiste = artistes.find(a => a.id === Number(m.artisteId));
                return (
                  <div
                    key={id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "8px 12px", borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={e => e.currentTarget.style.background = "rgba(124,58,237,0.08)"}
                    onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  >
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: "var(--text2)", width: 20 }}>
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.titre}</div>
                      <div style={{ fontSize: 11, color: "var(--accent2)" }}>
                        {artiste?.nom || "—"}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>{m.duree}</span>
                    <button
                      onClick={() => onPlay(m)}
                      style={{
                        background: "rgba(6,182,212,0.1)",
                        border: "1px solid rgba(6,182,212,0.25)",
                        borderRadius: 20,
                        color: "var(--cyan)",
                        padding: "4px 10px",
                        cursor: "pointer",
                        fontSize: 11
                      }}
                    >
                      ▶
                    </button>
                    <button
                      onClick={() => onRemove(playlist.id, id)}
                      style={{
                        background: "rgba(236,72,153,0.1)",
                        border: "1px solid rgba(236,72,153,0.2)",
                        borderRadius: 6,
                        color: "var(--pink)",
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: 11
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaylistCard;