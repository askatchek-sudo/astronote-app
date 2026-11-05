import { useState, useEffect } from 'react';
import { favorisAPI } from '../lib/api';

const BoutonFavori = ({ morceauId, currentUser, onOpenLogin }) => {
  const [estFavori, setEstFavori] = useState(false);
  const [loading, setLoading] = useState(false);

  // Vérifier si ce morceau est en favori quand l'utilisateur est connecté
  useEffect(() => {
    if (currentUser) {
      verifierFavori();
    } else {
      setEstFavori(false);
    }
  }, [morceauId, currentUser]);

  const verifierFavori = async () => {
    try {
      console.log("🔍 Vérification favori pour le morceau ID:", morceauId);
      const favoris = await favorisAPI.get();
      console.log("📦 Favoris reçus du backend:", favoris);
      
      // On compare en s'assurant que les deux sont des nombres
      const estDansListe = favoris.some(f => parseInt(f.id) === parseInt(morceauId));
      setEstFavori(estDansListe);
    } catch (error) {
      console.error('❌ Erreur vérification favori:', error);
    }
  };

  const handleClick = async (e) => {
    e.stopPropagation(); // Empêche de lancer la lecture du morceau
    
    if (!currentUser) {
      if (onOpenLogin) {
        onOpenLogin();
      } else {
        alert('💙 Connectez-vous pour ajouter ce morceau à vos favoris !');
      }
      return;
    }

    setLoading(true);
    try {
      console.log("📤 Envoi de la requête toggle pour le morceau:", morceauId);
      const result = await favorisAPI.toggle(morceauId);
      console.log("📥 Réponse du backend:", result);
      
      if (result.action === 'added') {
        setEstFavori(true);
      } else {
        setEstFavori(false);
      }
    } catch (error) {
      console.error('❌ Erreur critique toggle favori:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: loading ? 'wait' : 'pointer',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s',
        transform: estFavori ? 'scale(1.2)' : 'scale(1)',
        // Lueur AQUA quand c'est actif
        filter: estFavori ? 'drop-shadow(0 0 8px rgba(6,182,212,0.8))' : 'none'
      }}
      title={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      {estFavori ? (
        // ✅ CŒUR PLEIN EN COULEUR AQUA (var(--cyan))
        <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--cyan)" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ) : (
        // ✅ CŒUR VIDE (Contour)
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      )}
    </button>
  );
};

export default BoutonFavori;