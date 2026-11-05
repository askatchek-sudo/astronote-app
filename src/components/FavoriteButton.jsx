import useFavorites from "../hooks/useFavorites";

const FavoriteButton = ({ morceauId, size = 20 }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const fav = isFavorite(morceauId);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(morceauId);
      }}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: size,
        transition: "transform 0.2s",
        filter: fav ? "drop-shadow(0 0 8px rgba(236,72,153,0.6))" : "none"
      }}
      onMouseOver={e => e.currentTarget.style.transform = "scale(1.2)"}
      onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
      title={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {fav ? "❤️" : "🤍"}
    </button>
  );
};

export default FavoriteButton;