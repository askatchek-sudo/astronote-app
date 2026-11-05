import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import logo from '../assets/logo.png';

const Navbar = ({
  page,
  setPage,
  currentUser,
  onOpenAuth,
  artistes,
  morceaux,
  albums,
  evenements,
  setArtisteSelectionne,
  setAlbumSelectionne,
  setMorceauEnCours,
  theme,
  onToggleTheme
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [localUser, setLocalUser] = useState(currentUser);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    setLocalUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleFanConnected = (e) => setLocalUser(e.detail);
    const handleUserUpdated = (e) => setLocalUser(e.detail);
    const handleLogout = () => setLocalUser(null);
    const handleStorage = (e) => {
      if (e.key === 'user' || e.key === 'user-version') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try { setLocalUser(JSON.parse(userStr)); }
          catch (err) { setLocalUser(null); }
        } else {
          setLocalUser(null);
        }
      }
    };

    window.addEventListener("fan-connected", handleFanConnected);
    window.addEventListener("user-updated", handleUserUpdated);
    window.addEventListener("logout", handleLogout);
    window.addEventListener("storage", handleStorage);

    const interval = setInterval(() => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setLocalUser(prev =>
            !prev || prev.id !== user.id || prev.email !== user.email ? user : prev
          );
        } catch (err) {
          setLocalUser(null);
        }
      } else {
        setLocalUser(prev => (prev === null ? prev : null));
      }
    }, 500);

    return () => {
      window.removeEventListener("fan-connected", handleFanConnected);
      window.removeEventListener("user-updated", handleUserUpdated);
      window.removeEventListener("logout", handleLogout);
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "accueil", label: "Accueil" },
    { id: "artistes", label: "Artistes" },
    { id: "musique", label: "Musique" },
    { id: "services", label: "Nos Services" },
    { id: "contact", label: "Contact" },
  ];

  const isFan = localUser && localUser.role !== 'ADMIN';
  const isLight = theme === 'light';

  const themeButtonStyle = {
    width: 38, height: 38, borderRadius: "50%",
    background: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.06)",
    border: "1px solid var(--border)", color: "var(--text)",
    fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform .2s ease", flexShrink: 0
  };

  const accountButtonStyle = {
    padding: "8px 20px",
    background: page === "mon-compte" ? "rgba(6,182,212,0.15)" : "var(--bg-input, rgba(255,255,255,0.05))",
    border: `1px solid ${page === "mon-compte" ? "var(--cyan)" : "var(--border)"}`,
    borderRadius: 50, color: page === "mon-compte" ? "var(--cyan)" : "var(--text)",
    cursor: "pointer", fontSize: 13, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap"
  };

  const loginButtonStyle = {
    padding: "8px 20px",
    background: "linear-gradient(135deg,var(--accent),var(--cyan))",
    border: "none", borderRadius: 50, color: "#fff",
    cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: 1, whiteSpace: "nowrap"
  };

  const searchBarProps = {
    artistes: artistes || [],
    morceaux: morceaux || [],
    albums: albums || [],
    evenements: evenements || [],
    setPage,
    setArtisteSelectionne,
    setAlbumSelectionne,
    setMorceauEnCours
  };

  return (
    <>
      {/* BARRE DE NAVIGATION PRINCIPALE */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrolled ? "12px 24px" : "16px 24px",
        background: scrolled ? "var(--bg-nav, rgba(15, 23, 42, 0.95))" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        transition: "all 0.3s ease",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} 
            onClick={() => { setPage('accueil'); setIsMobileMenuOpen(false); }}
          >
            <img 
              src={logo} 
              alt="ASTRONOTE" 
              style={{ height: isMobile ? 35 : 45, width: 'auto', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }} 
            />
            {!isMobile && (
              <span style={{ 
                fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: 4,
                background: 'linear-gradient(90deg, var(--accent2), var(--cyan))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                ASTRONOTE
              </span>
            )}
          </div>
          
          {isMobile && (
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ background: "none", border: "none", color: "var(--text)", fontSize: 24, cursor: "pointer", padding: 4, display: "flex", alignItems: "center", marginLeft: 8 }}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>

        {!isMobile && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  padding: "8px 16px",
                  background: page === item.id ? "rgba(124,58,237,0.15)" : "transparent",
                  border: "none", borderRadius: 50,
                  color: page === item.id ? "var(--accent2)" : "var(--text2)",
                  cursor: "pointer", fontSize: 13, fontWeight: 600, letterSpacing: 1,
                  transition: "all 0.2s",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {!isMobile && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <SearchBar {...searchBarProps} />
            <button
              onClick={onToggleTheme}
              title={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
              style={themeButtonStyle}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1) rotate(15deg)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1) rotate(0deg)"}
            >
              {isLight ? "🌙" : "☀️"}
            </button>

            {isFan ? (
              <button onClick={() => setPage("mon-compte")} style={accountButtonStyle}>
                👤 {localUser.nom || "Mon Compte"}
              </button>
            ) : (
              <button onClick={onOpenAuth} style={loginButtonStyle}>
                ✦ Connexion
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ✅ MENU MOBILE OVERLAY CORRIGÉ */}
      {isMobile && isMobileMenuOpen && (
        <div style={{
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          height: "100dvh", /* ✅ Hauteur dynamique pour s'adapter aux barres du navigateur mobile */
          background: "var(--bg-elevated, rgba(15, 23, 42, 0.98))",
          backdropFilter: "blur(20px)",
          zIndex: 90, /* ✅ Inférieur à la navbar (100) pour que la navbar reste toujours au-dessus et cliquable */
          paddingTop: "80px", /* ✅ Espace pour ne pas être caché par la navbar fixe */
          paddingBottom: "40px", /* ✅ Marge en bas garantie pour atteindre le dernier élément */
          padding: "80px 24px 40px 24px",
          display: "flex", flexDirection: "column", gap: 24,
          overflowY: "auto",
          animation: "slideDown 0.3s ease"
        }}>
          {/* Barre de recherche Mobile */}
          <div style={{ width: "100%" }}>
            <SearchBar {...searchBarProps} />
          </div>

          {/* Liens de navigation Mobile */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setIsMobileMenuOpen(false); }}
                style={{
                  padding: "16px",
                  background: page === item.id ? "rgba(124,58,237,0.15)" : "transparent",
                  border: `1px solid ${page === item.id ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 12,
                  color: page === item.id ? "var(--accent2)" : "var(--text)",
                  cursor: "pointer", fontSize: 16, fontWeight: 600,
                  textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                  transition: "all 0.2s"
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Bas du menu mobile : Thème + Compte */}
          <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 16 }}>
            <button 
              onClick={onToggleTheme} 
              style={{ ...themeButtonStyle, width: "100%", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 12, fontSize: 16 }}
            >
              {isLight ? "🌙 Passer en mode sombre" : "☀️ Passer en mode clair"}
            </button>
            
            {isFan ? (
              <button 
                onClick={() => { setPage("mon-compte"); setIsMobileMenuOpen(false); }} 
                style={{ ...accountButtonStyle, width: "100%", justifyContent: "center", padding: "14px", fontSize: 16, borderRadius: 12 }}
              >
                👤 {localUser.nom || "Mon Compte"}
              </button>
            ) : (
              <button 
                onClick={() => { onOpenAuth(); setIsMobileMenuOpen(false); }} 
                style={{ ...loginButtonStyle, width: "100%", justifyContent: "center", padding: "14px", fontSize: 16, borderRadius: 12 }}
              >
                ✦ Connexion
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default Navbar;