import { useState, useEffect } from "react";
import StarsCanvas from "./components/StarsCanvas";
import Nebula from "./components/Nebula";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GlobalPlayer from "./components/GlobalPlayer";
import Accueil from "./pages/Accueil";
import Artistes from "./pages/Artistes";
import Musique from "./pages/Musique";
import Contact from "./pages/Contact";
import PageAdmin from "./pages/admin/PageAdmin";
import MonCompte from "./pages/MonCompte";
import AuthModal from './components/AuthModal';
import { artistesAPI, albumsAPI, evenementsAPI, morceauxAPI } from './lib/api';
import ArtisteDetail from "./pages/ArtisteDetail";
import AlbumDetail from "./pages/AlbumDetail";
import EvenementDetail from "./pages/EvenementDetail";
import LoadingScreen from './components/LoadingScreen';
import Services from "./pages/Services";

export default function App() {
  const [page, setPage] = useState("accueil");
  const [isLoading, setIsLoading] = useState(true);
  
  const [artistes, setArtistes] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [morceaux, setMorceaux] = useState([]);
  
  const [morceauEnCours, setMorceauEnCours] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // ✅ États pour la sélection (cruciaux pour la navigation)
  const [artisteSelectionne, setArtisteSelectionne] = useState(null);
  const [albumSelectionne, setAlbumSelectionne] = useState(null);
  const [evenementSelectionne, setEvenementSelectionne] = useState(null);
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  // 1. Vérifier la connexion au démarrage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Synchroniser l'utilisateur quand une connexion réussit depuis une modale
  useEffect(() => {
    const handleFanConnected = (e) => {
      console.log("🎉 Connexion détectée depuis une page :", e.detail);
      setCurrentUser(e.detail);
    };
    window.addEventListener("fan-connected", handleFanConnected);
    return () => window.removeEventListener("fan-connected", handleFanConnected);
  }, []);

  // 2. Charger les données et gérer le LoadingScreen
  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        const [artistesData, albumsData, evenementsData, morceauxData] = await Promise.all([
          artistesAPI.getAll(),
          albumsAPI.getAll(),
          evenementsAPI.getAll(),
          morceauxAPI.getAll()
        ]);
        setArtistes(artistesData);
        setAlbums(albumsData);
        setEvenements(evenementsData);
        setMorceaux(morceauxData);
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    };
    chargerDonnees();
  }, []);

  // Écouter la sélection d'un artiste depuis une page enfant
  useEffect(() => {
    const handleArtisteSelected = (e) => setArtisteSelectionne(e.detail);
    window.addEventListener("artiste-selected", handleArtisteSelected);
    return () => window.removeEventListener("artiste-selected", handleArtisteSelected);
  }, []);

  // Écouter la sélection d'un album depuis une page enfant
  useEffect(() => {
    const handleAlbumSelected = (e) => setAlbumSelectionne(e.detail);
    window.addEventListener("album-selected", handleAlbumSelected);
    return () => window.removeEventListener("album-selected", handleAlbumSelected);
  }, []);

  // Écouter la sélection d'un événement
  useEffect(() => {
    const handleEvenementSelected = (e) => setEvenementSelectionne(e.detail);
    window.addEventListener("evenement-selected", handleEvenementSelected);
    return () => window.removeEventListener("evenement-selected", handleEvenementSelected);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  // 3. Fonctions d'authentification
  const openAuthModal = () => setShowAuthModal(true);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setMorceauEnCours(null);
    setPage('accueil');
    window.location.href = '/';
  };

  // 4. Affichage du LoadingScreen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 5. Rendu Admin
  if (page === "admin") {
    return (
      <>
        <div className="space-bg">
          <Nebula />
          <StarsCanvas />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <PageAdmin
            artistes={artistes} setArtistes={setArtistes}
            morceaux={morceaux} setMorceaux={setMorceaux}
            albumsApp={albums} setAlbumsApp={setAlbums}
            evenementsApp={evenements} setEvenementsApp={setEvenements}
          />
        </div>
      </>
    );
  }

  // 6. Rendu Site Public
  return (
    <>
      <Nebula />
      <StarsCanvas />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar 
          page={page} 
          setPage={setPage} 
          currentUser={currentUser} 
          onOpenAuth={openAuthModal} 
          artistes={artistes} 
          morceaux={morceaux} 
          albums={albums} 
          evenements={evenements} 
          setArtisteSelectionne={setArtisteSelectionne} 
          setAlbumSelectionne={setAlbumSelectionne} 
          setMorceauEnCours={setMorceauEnCours} 
          theme={theme} 
          onToggleTheme={toggleTheme} 
        />
        
        <main>
          {page === "accueil" && (
            <Accueil 
              setPage={setPage} 
              artistes={artistes} 
              evenements={evenements} 
              currentUser={currentUser} 
              onOpenAuth={openAuthModal} 
              setArtisteSelectionne={setArtisteSelectionne} 
              setEvenementSelectionne={setEvenementSelectionne} 
            />
          )}
          
          {page === "artistes" && (
            <Artistes 
              artistes={artistes} 
              setPage={setPage} 
              setArtisteSelectionne={setArtisteSelectionne} 
            />
          )}
          
          {page === "artiste-detail" && (
            <ArtisteDetail 
              artisteId={artisteSelectionne} 
              artistes={artistes} 
              morceaux={morceaux} 
              albums={albums} 
              setMorceauEnCours={setMorceauEnCours}
              morceauEnCours={morceauEnCours} 
              setPage={setPage} 
              setAlbumSelectionne={setAlbumSelectionne} 
              currentUser={currentUser} 
            />
          )}
          
          {page === "musique" && (
            <Musique 
              artistes={artistes} 
              morceaux={morceaux} 
              albums={albums} 
              setMorceauEnCours={setMorceauEnCours} 
              morceauEnCours={morceauEnCours}
              setPage={setPage} 
              setAlbumSelectionne={setAlbumSelectionne} 
              currentUser={currentUser} 
              onOpenAuth={openAuthModal} 
            />
          )}
          
          {page === "services" && <Services setPage={setPage} />}
          {page === "contact" && <Contact />}
          
          {page === "mon-compte" && (
            <MonCompte 
              currentUser={currentUser} 
              setMorceauEnCours={setMorceauEnCours} 
              morceauEnCours={morceauEnCours} 
              onLogout={handleLogout}
              setPage={setPage}
              setAlbumSelectionne={setAlbumSelectionne}
              albums={albums}
              morceaux={morceaux}
              artistes={artistes}
            />
          )}
          
          {page === "album-detail" && (
            <AlbumDetail 
              albumId={albumSelectionne} 
              artistes={artistes} 
              morceaux={morceaux} 
              albums={albums} 
              setMorceauEnCours={setMorceauEnCours}
              morceauEnCours={morceauEnCours} 
              setPage={setPage} 
              currentUser={currentUser} 
            />
          )}
          
          {page === "evenement-detail" && (
            <EvenementDetail 
              evenementId={evenementSelectionne} 
              evenements={evenements} 
              currentUser={currentUser} 
              onOpenAuth={openAuthModal} 
              setPage={setPage} 
            />
          )}
        </main>
        
        <Footer setPage={setPage} />
        
        <GlobalPlayer 
          morceau={morceauEnCours} 
          artistes={artistes} 
          setMorceauEnCours={setMorceauEnCours} 
          onClose={() => setMorceauEnCours(null)} 
        />
        
        {/* ✅ BOUTON ADMIN FLOTTANT : Visible uniquement pour stetw, mick wally, freddy */}
        {(() => {
          const userName = currentUser?.nom?.toLowerCase() || '';
          const specialAdmins = ['stetw', 'mick wally', 'freddy'];
          return specialAdmins.includes(userName);
        })() && (
          <div style={{ position: "fixed", bottom: morceauEnCours ? 110 : 20, right: 20, zIndex: 50, transition: "bottom .3s" }}>
            <button onClick={() => setPage("admin")} style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "var(--accent2)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 15px rgba(124,58,237,0.3)" }}>
              ⚙️
            </button>
          </div>
        )}
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          onLoginSuccess={handleLoginSuccess} 
        />
      </div>
    </>
  );
}