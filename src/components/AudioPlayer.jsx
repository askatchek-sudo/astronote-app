import { useState, useRef } from "react";

const AudioPlayer = ({ src }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const toggle = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };
  const onTime = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 20, padding: "6px 12px", cursor: "pointer" }} onClick={toggle}>
      <audio ref={audioRef} src={src} onTimeUpdate={onTime} onEnded={() => setPlaying(false)} />
      <button style={{ background: "none", border: "none", color: "var(--cyan)", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1, width: 20, flexShrink: 0 }}>{playing ? "⏸" : "▶"}</button>
      <div onClick={(e) => { e.stopPropagation(); }} style={{ width: 70, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", cursor: "pointer" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg,var(--accent),var(--cyan))", borderRadius: 2, transition: "width .1s" }} />
      </div>
      <span style={{ fontSize: 11, color: "var(--cyan)", fontWeight: 600, whiteSpace: "nowrap" }}>Écouter</span>
    </div>
  );
};
export default AudioPlayer;