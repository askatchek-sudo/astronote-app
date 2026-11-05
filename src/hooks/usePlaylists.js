import { useState, useEffect } from "react";

export default function usePlaylists() {
  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem("astronote_playlists");
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          nom: "Top Afrobeat 2026",
          desc: "Les meilleurs titres afrobeat du moment",
          cover: "🌍",
          morceaux: [1, 2, 3],
          public: true,
          creeLe: "2026-01-15"
        },
        {
          id: 2,
          nom: "Chill Vibes",
          desc: "Musique relaxante pour se détendre",
          cover: "🌙",
          morceaux: [4, 5],
          public: true,
          creeLe: "2026-02-20"
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("astronote_playlists", JSON.stringify(playlists));
  }, [playlists]);

  const createPlaylist = (nom, desc, cover) => {
    const newPlaylist = {
      id: Date.now(),
      nom,
      desc,
      cover: cover || "🎵",
      morceaux: [],
      public: true,
      creeLe: new Date().toISOString().slice(0, 10)
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  };

  const addToPlaylist = (playlistId, morceauId) => {
    setPlaylists(prev => prev.map(p => 
      p.id === playlistId && !p.morceaux.includes(morceauId)
        ? { ...p, morceaux: [...p.morceaux, morceauId] }
        : p
    ));
  };

  const removeFromPlaylist = (playlistId, morceauId) => {
    setPlaylists(prev => prev.map(p => 
      p.id === playlistId
        ? { ...p, morceaux: p.morceaux.filter(id => id !== morceauId) }
        : p
    ));
  };

  const deletePlaylist = (playlistId) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  };

  return { playlists, createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist };
}