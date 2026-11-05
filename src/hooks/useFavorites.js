import { useState, useEffect } from "react";

export default function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("astronote_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("astronote_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (morceauId) => {
    setFavorites(prev => 
      prev.includes(morceauId) 
        ? prev.filter(id => id !== morceauId)
        : [...prev, morceauId]
    );
  };

  const isFavorite = (morceauId) => favorites.includes(morceauId);

  return { favorites, toggleFavorite, isFavorite };
}