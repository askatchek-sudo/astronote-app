import { useState, useRef, useEffect } from "react";
import { morceauxAPI } from '../lib/api';

// ✅ AJOUT : Variable d'environnement pour la production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const GlobalPlayer = ({ morceau, artistes, setMorceauEnCours, onClose }) => {
  if (!morceau) return null;

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);

  const hasCountedStream = useRef(false);

  const playlist = morceau.playlist || null;
  const [currentIndex, setCurrentIndex] = useState(playlist ? playlist.indexActuel : 0);
  const [isShuffle, setIsShuffle] = useState(playlist ? playlist.shuffle : false);

  // ✅ CORRECTION ANTI-CRASH : Synchronisation sécurisée de l'index
  useEffect(() => {
    if (morceau && morceau.playlist) {
      const newIndex = morceau.playlist.indexActuel;
      const maxIndex = morceau.playlist.file.length - 1;
      // Si l'ancien index est plus grand que la nouvelle liste, on revient à 0
      const safeIndex = newIndex > maxIndex ? 0 : newIndex;
      
      setCurrentIndex(safeIndex);
      setIsShuffle(morceau.playlist.shuffle);
    } else if (!morceau.playlist) {
      setCurrentIndex(0);
    }
  }, [morceau]);

  // ✅ SÉCURITÉ MAXIMALE : Empêche "Cannot read properties of undefined"
  const safeIndex = playlist && currentIndex >= playlist.file.length ? 0 : (playlist ? currentIndex : 0);
  const currentTrack = playlist ? playlist.file[safeIndex] : morceau;

  const artiste = artistes?.find(a => a.id === Number(currentTrack.artisteId));
  const nomArtiste = artiste?.nom || "Artiste inconnu";
  const imgArtiste = artiste?.img || "🎵";

  // ✅ CORRECTION : Utilise API_URL au lieu de localhost en dur
  const audioSrc = currentTrack.audioUrl 
    ? (currentTrack.audioUrl.startsWith("http") ? currentTrack.audioUrl : `${API_URL}${currentTrack.audioUrl}`)
    : "";

  useEffect(() => {
    if (audioRef.current && currentTrack && audioSrc) {
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setPlaying(true))
          .catch(() => {
            console.log("Lecture auto en attente d'interaction utilisateur");
            setPlaying(false);
          });
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [safeIndex, audioSrc]); // ✅ Dépendance mise à jour

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      hasCountedStream.current = false;
      const handlePlay = () => {
        if (!hasCountedStream.current && currentTrack.id) {
          morceauxAPI.incrementStream(currentTrack.id);
          hasCountedStream.current = true;
          console.log(`📈 Stream comptabilisé pour : ${currentTrack.titre} (ID: ${currentTrack.id})`);
        }
      };
      const audioElement = audioRef.current;
      audioElement.addEventListener('play', handlePlay);
      return () => audioElement.removeEventListener('play', handlePlay);
    }
  }, [currentTrack]);

  const updatePlayerState = (newIndex) => {
    setCurrentIndex(newIndex);
    if (setMorceauEnCours && playlist) {
      setMorceauEnCours({
        ...playlist.file[newIndex],
        playlist: {
          ...playlist,
          indexActuel: newIndex
        }
      });
    }
  };

  const handleNext = () => {
    if (!playlist) return;
    let nextIndex;
    if (isShuffle) {
      if (playlist.file.length === 1) return;
      do { nextIndex = Math.floor(Math.random() * playlist.file.length); } while (nextIndex === currentIndex);
    } else {
      nextIndex = (currentIndex + 1) % playlist.file.length;
    }
    updatePlayerState(nextIndex);
  };

  const handlePrev = () => {
    if (!playlist) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prevIndex = (currentIndex - 1 + playlist.file.length) % playlist.file.length;
    updatePlayerState(prevIndex);
  };

  const handleTrackEnded = () => {
    if (playlist) {
      handleNext();
    } else {
      setPlaying(false);
      if (audioRef.current) audioRef.current.currentTime = 0;
      if (setMorceauEnCours) setMorceauEnCours(null); 
    }
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); } 
    else { audio.play(); setPlaying(true); }
  };

  const onTime = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setProgress((audio.currentTime / audio.duration) * 100);
      setCurrentTime(formatTime(audio.currentTime));
      setDuration(formatTime(audio.duration));
    }
  };

  const onSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = percent * audio.duration;
  };

  const onVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isImageUrl = typeof imgArtiste === 'string' && (imgArtiste.startsWith("http://") || imgArtiste.startsWith("https://") || imgArtiste.startsWith("/uploads/"));
  
  // ✅ CORRECTION : Utilise API_URL au lieu de localhost en dur pour les images
  const finalImgUrl = isImageUrl && imgArtiste.startsWith("/uploads/") ? `${API_URL}${imgArtiste}` : imgArtiste;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--bg-elevated)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "12px 24px", zIndex: 1000, display: "flex", alignItems: "center", gap: 20, boxShadow: "0 -4px 20px rgba(0,0,0,0.5)" }}>
      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} onTimeUpdate={onTime} onEnded={handleTrackEnded} onLoadedMetadata={onTime} />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "0 0 250px" }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: isImageUrl ? "#1a1a2e" : "linear-gradient(135deg,var(--accent),var(--cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, overflow: "hidden" }}>
          {isImageUrl ? (
            <img src={finalImgUrl} alt={nomArtiste} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="line-height:1">🎵</span>'; }} />
          ) : <span style={{ lineHeight: 1 }}>{imgArtiste}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.titre || "Titre inconnu"}</div>
          <div style={{ fontSize: 12, color: "var(--accent2)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {nomArtiste}
            {playlist && <span style={{ marginLeft: 8, opacity: 0.7, fontFamily: "'Space Mono', monospace", fontSize: 10 }}>• {safeIndex + 1} / {playlist.file.length}</span>}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {playlist && (
            <button onClick={() => setIsShuffle(!isShuffle)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: isShuffle ? "var(--cyan)" : "var(--text2)", opacity: isShuffle ? 1 : 0.6, transition: "all 0.2s" }}>🔀</button>
          )}
          <button onClick={handlePrev} disabled={!playlist} style={{ background: "none", border: "none", cursor: playlist ? "pointer" : "default", fontSize: 22, color: playlist ? "var(--text)" : "var(--text2)", opacity: playlist ? 1 : 0.4, transition: "all 0.2s" }}>⏮</button>
          <button onClick={toggle} disabled={!audioSrc} style={{ width: 44, height: 44, borderRadius: "50%", background: audioSrc ? "linear-gradient(135deg,var(--accent),var(--cyan))" : "#555", border: "none", color: "#fff", fontSize: 20, cursor: audioSrc ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: audioSrc ? "0 4px 12px rgba(124,58,237,0.4)" : "none", transition: "transform 0.1s" }} onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.95)"} onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}>
            {playing ? "⏸" : "▶"}
          </button>
          <button onClick={handleNext} disabled={!playlist} style={{ background: "none", border: "none", cursor: playlist ? "pointer" : "default", fontSize: 22, color: playlist ? "var(--text)" : "var(--text2)", opacity: playlist ? 1 : 0.4, transition: "all 0.2s" }}>⏭</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 600 }}>
          <span style={{ fontSize: 11, color: "var(--text2)", fontFamily: "'Space Mono',monospace", width: 40, textAlign: "right" }}>{currentTime}</span>
          <div onClick={onSeek} style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden", cursor: "pointer", position: "relative" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg,var(--accent),var(--cyan))", borderRadius: 3, transition: "width .1s" }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--text2)", fontFamily: "'Space Mono',monospace", width: 40 }}>{duration}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "0 0 200px", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔊</span>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={onVolumeChange} style={{ width: 80, height: 4, accentColor: "var(--cyan)", cursor: "pointer" }} />
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 20, cursor: "pointer", padding: "4px 8px", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "var(--pink)"} onMouseLeave={(e) => e.target.style.color = "var(--text2)"}>✕</button>
      </div>
    </div>
  );
};

export default GlobalPlayer;