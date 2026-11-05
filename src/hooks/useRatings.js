import { useState, useEffect } from "react";

export default function useRatings() {
  const [ratings, setRatings] = useState(() => {
    try {
      const saved = localStorage.getItem("astronote_ratings");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("astronote_ratings", JSON.stringify(ratings));
  }, [ratings]);

  const rateMorceau = (morceauId, note) => {
    setRatings(prev => ({
      ...prev,
      [morceauId]: {
        ...prev[morceauId],
        userRating: note,
        totalRatings: (prev[morceauId]?.totalRatings || 0) + 1,
        sumRatings: (prev[morceauId]?.sumRatings || 0) + note
      }
    }));
  };

  const getAverageRating = (morceauId) => {
    const r = ratings[morceauId];
    if (!r || r.totalRatings === 0) return 0;
    return (r.sumRatings / r.totalRatings).toFixed(1);
  };

  const getUserRating = (morceauId) => ratings[morceauId]?.userRating || 0;

  const getTotalRatings = (morceauId) => ratings[morceauId]?.totalRatings || 0;

  return { ratings, rateMorceau, getAverageRating, getUserRating, getTotalRatings };
}