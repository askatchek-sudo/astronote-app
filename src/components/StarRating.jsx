import { useState } from "react";
import useRatings from "../hooks/useRatings";

const StarRating = ({ morceauId }) => {
  const { rateMorceau, getAverageRating, getUserRating, getTotalRatings } = useRatings();
  const [hover, setHover] = useState(0);
  const userRating = getUserRating(morceauId);
  const avgRating = getAverageRating(morceauId);
  const totalRatings = getTotalRatings(morceauId);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={(e) => {
              e.stopPropagation();
              rateMorceau(morceauId, star);
            }}
            onMouseOver={(e) => {
              e.stopPropagation();
              setHover(star);
            }}
            onMouseOut={() => setHover(0)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              padding: 0,
              transition: "transform 0.1s"
            }}
          >
            {(hover || userRating) >= star ? "⭐" : "☆"}
          </button>
        ))}
      </div>
      {totalRatings > 0 && (
        <span style={{ fontSize: 11, color: "var(--text2)" }}>
          {avgRating} ({totalRatings})
        </span>
      )}
    </div>
  );
};

export default StarRating;