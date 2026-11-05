import { useState, useEffect, useRef } from "react"; // ✅ AJOUT DE useRef
import { evenementsAPI } from "../lib/api";
import AuthModal from "../components/AuthModal";
import BoutonPartage from "../components/BoutonPartage";
import { ShareIcon } from '../components/Icons';

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/uploads/")) return `http://localhost:3001${img}`;
  if (img.includes("/uploads/")) return `http://localhost:3001/${img.replace(/^\//, "")}`;
  return null;
};

const EvenementDetail = ({ evenementId, evenements, currentUser, onOpenAuth, setPage }) => {
  const evenement = evenements.find(e => e.id === Number(evenementId));

  const [categories, setCategories] = useState([]);
  const [selectedCategorie, setSelectedCategorie] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localUser, setLocalUser] = useState(currentUser);
  
  // ✅ RÉFÉRENCE POUR LE SCROLL AUTOMATIQUE
  const actionsRef = useRef(null);

  useEffect(() => {
    setLocalUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    const handleFanConnected = (e) => setLocalUser(e.detail);
    const handleUserUpdated = (e) => setLocalUser(e.detail);
    
    window.addEventListener("fan-connected", handleFanConnected);
    window.addEventListener("user-updated", handleUserUpdated);
    
    return () => {
      window.removeEventListener("fan-connected", handleFanConnected);
      window.removeEventListener("user-updated", handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    if (evenement) {
      if (evenement.categorieTickets && evenement.categorieTickets.length > 0) {
        const categoriesTriees = [...evenement.categorieTickets].sort((a, b) => a.prix - b.prix);
        setCategories(categoriesTriees);
      } else {
        evenementsAPI.getCategorieTickets(evenement.id)
          .then(cats => {
            setCategories([...cats].sort((a, b) => a.prix - b.prix));
          })
          .catch(err => console.error("Erreur catégories:", err));
      }
    }
  }, [evenement]);

  if (!evenement) {
    return (
      <div style={{ padding: "120px 20px", textAlign: "center" }}>
        <h1>Événement introuvable</h1>
        <p style={{ color: "var(--text2)", marginTop: 10 }}>ID recherché : {evenementId}</p>
        <button className="btn-outline" onClick={() => setPage("accueil")} style={{ marginTop: 20 }}>
          ← Retour à l'accueil
        </button>
      </div>
    );
  }

  const coverUrl = getImageUrl(evenement.coverUrl);
  const total = selectedCategorie ? selectedCategorie.prix * quantite : 0;

  // ✅ FONCTION POUR GÉRER LE CLIC ET LE SCROLL
  const handleCategoryClick = (cat) => {
    setSelectedCategorie(cat);
    // Petit délai pour laisser le temps au DOM de rendre le nouveau bloc
    setTimeout(() => {
      if (actionsRef.current) {
        actionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleReservation = () => {
    if (!selectedCategorie) {
      alert("Veuillez sélectionner une catégorie de ticket.");
      return;
    }

    let userActuel = localUser || currentUser;
    
    if (!userActuel) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          userActuel = JSON.parse(userStr);
          setLocalUser(userActuel);
        } catch (e) {
          console.error("Erreur lecture user", e);
        }
      }
    }

    if (!userActuel) {
      setShowAuth(true);
      return;
    }
    
    setShowModal(true);
  };

  const confirmerAchat = async () => {
    setLoading(true);
    try {
      const userActuel = localUser || currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!userActuel || !userActuel.id) {
        throw new Error("Utilisateur non identifié. Veuillez vous reconnecter.");
      }

      const result = await evenementsAPI.acheterTickets({
        userId: userActuel.id,
        evenementId: Number(evenement.id),
        categorieId: Number(selectedCategorie.id),
        quantite: Number(quantite)
      });
      
      setShowModal(false);
      alert("✅ Réservation réussie ! Vos tickets sont disponibles dans votre espace 'Mon Compte'.");
      setPage("mon-compte");
    } catch (error) {
      console.error("Erreur achat ticket:", error);
      alert("❌ Erreur : " + (error.message || "Impossible de finaliser l'achat."));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("fr-FR", { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // ✅ VÉRIFICATION STRICTE POUR LA GRATUITÉ (Uniquement pour stetw avec les bonnes infos)
  const userActuelCheck = localUser || currentUser || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null);
  const isStetwVerified = 
    userActuelCheck?.nom?.toLowerCase() === 'stetw' && 
    userActuelCheck?.telephone === '681791285' && 
    userActuelCheck?.email === 'ladaleuer2@gmail.com';

  return (
    <>
      {/* ✅ CSS RESPONSIVE POUR LA PAGE DÉTAIL ÉVÉNEMENT */}
      <style>{`
        .event-page { padding: 100px 16px 60px !important; }
        .event-grid { grid-template-columns: 1fr !important; }
        .event-image { min-height: 250px !important; }
        .event-info { padding: 24px !important; }
        .event-actions { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
        .event-actions-total { text-align: center !important; }
        .event-actions-btn { width: 100% !important; justify-content: center !important; }
        .modal-content { padding: 24px !important; margin: 16px !important; }
        
        @media (min-width: 768px) {
          .event-page { padding: 100px 40px 80px !important; }
          .event-grid { grid-template-columns: 1fr 1fr !important; }
          .event-image { min-height: 350px !important; }
          .event-info { padding: 40px !important; }
          .event-actions { flex-direction: row !important; align-items: center !important; gap: 24px !important; }
          .event-actions-total { text-align: right !important; }
          .event-actions-btn { width: auto !important; }
          .modal-content { padding: 32px !important; margin: 0 !important; max-width: 500px !important; }
        }
      `}</style>

      <div className="event-page" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <button 
          onClick={() => setPage("accueil")} 
          className="btn-outline" 
          style={{ marginBottom: 24, padding: "8px 18px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          ← Retour à l'accueil
        </button>

        <div className="glass-card" style={{ overflow: "hidden", marginBottom: 32, animation: "fadeUp 0.6s ease both" }}>
          <div className="event-grid" style={{ display: "grid", gap: 0 }}>
            <div className="event-image" style={{ background: coverUrl ? "#1a1a2e" : "linear-gradient(135deg,var(--pink),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
              {coverUrl ? (
                <img src={coverUrl} alt={evenement.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 80, '@media (min-width: 768px)': { fontSize: 120 } }}>🎤</span>
              )}
            </div>
            
            <div className="event-info" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Événement ASTRONOTE</div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(24px, 5vw, 42px)", fontWeight: 900, letterSpacing: 2, lineHeight: 1.1, margin: 0, flex: 1, minWidth: "200px" }} className="glow-text">
                  {evenement.titre}
                </h1>
                <BoutonPartage 
                  titre={evenement.titre} 
                  texte={`🎟️ Ne manque pas "${evenement.titre}" sur ASTRONOTE ! Rejoins-nous le ${formatDate(evenement.date)} à ${evenement.lieu}.`}
                  url={`${window.location.origin}/evenements/${evenement.id}`}
                  type="evenement"
                  currentUser={localUser}
                  icon={<ShareIcon size={16} />}
                />
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <span style={{ padding: "6px 14px", background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: 50, color: "var(--pink)", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  📅 {formatDate(evenement.date)}
                </span>
                <span style={{ padding: "6px 14px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 50, color: "var(--cyan)", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  📍 {evenement.lieu}, {evenement.pays}
                </span>
              </div>
              
              <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, margin: 0 }}>
                {evenement.description || "Aucune description disponible."}
              </p>
            </div>
          </div>
        </div>

        <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(18px, 3vw, 20px)", fontWeight: 700, letterSpacing: 2, marginBottom: 20, color: "var(--accent2)" }}>
          🎟 Choisissez vos places
        </h3>
        
        {categories.length === 0 ? (
          <div className="glass-card" style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>
            Les billets seront bientôt disponibles.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>
            {categories.map(cat => {
              const placesRestantes = cat.placesTotales - cat.placesVendues;
              const isSelected = selectedCategorie?.id === cat.id;
              return (
                <div 
                  key={cat.id} 
                  onClick={() => handleCategoryClick(cat)} /* ✅ MODIFIÉ ICI */
                  className="glass-card" 
                  style={{ 
                    padding: 24, 
                    cursor: "pointer", 
                    border: isSelected ? "2px solid var(--cyan)" : "1px solid var(--border)", 
                    transition: "all 0.2s",
                    transform: isSelected ? "translateY(-4px)" : "none",
                    boxShadow: isSelected ? "0 8px 24px rgba(6,182,212,0.15)" : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16, gap: 8 }}>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700 }}>{cat.nom}</div>
                    {placesRestantes < 20 && <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700, whiteSpace: "nowrap" }}>⚠ {placesRestantes}</span>}
                  </div>
                  
                  {/* ✅ AFFICHAGE DU PRIX : GRATUIT pour stetw vérifié, prix normal sinon */}
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: isStetwVerified ? "#00e676" : "var(--cyan)", marginBottom: 8 }}>
                    {isStetwVerified ? (
                      "GRATUIT 🎁"
                    ) : (
                      <>{cat.prix.toLocaleString()} <span style={{ fontSize: 14, color: "var(--text2)" }}>FCFA</span></>
                    )}
                  </div>
                  
                  <div style={{ fontSize: 13, color: "var(--text2)" }}>{placesRestantes} places disponibles</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ✅ AJOUT DE ref={actionsRef} ICI POUR CIBLER LE SCROLL */}
        {selectedCategorie && (
          <div ref={actionsRef} className="glass-card event-actions" style={{ padding: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, animation: "fadeUp 0.4s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Quantité :</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: 50 }}>
                <button onClick={() => setQuantite(Math.max(1, quantite - 1))} style={{ background: "none", border: "none", color: "var(--cyan)", fontSize: 20, cursor: "pointer", padding: 0, width: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 18, fontWeight: 700, width: 24, textAlign: "center" }}>{quantite}</span>
                <button onClick={() => setQuantite(Math.min(10, quantite + 1))} style={{ background: "none", border: "none", color: "var(--cyan)", fontSize: 20, cursor: "pointer", padding: 0, width: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>
            
            <div className="event-actions-total" style={{ display: "flex", alignItems: "center", gap: 24, flex: 1, justifyContent: "flex-end" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 }}>Total à payer</div>
                
                {/* ✅ AFFICHAGE DU TOTAL : GRATUIT pour stetw vérifié, prix normal sinon */}
                {isStetwVerified ? (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: "#00e676" }}>GRATUIT 🎁</div>
                ) : (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: "var(--gold)" }}>{total.toLocaleString()} FCFA</div>
                )}
                
              </div>
              <button onClick={handleReservation} className="btn-primary event-actions-btn" style={{ padding: "14px 32px", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                🎟 Réserver
              </button>
            </div>
          </div>
        )}

        {showModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div className="glass-card modal-content" style={{ width: "100%", animation: "fadeUp 0.3s ease both" }}>
              <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, marginBottom: 16, textAlign: "center" }}>Confirmer la réservation</h3>
              
              <div style={{ background: "rgba(0,0,0,0.3)", padding: 16, borderRadius: 12, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 4 }}>
                  <span style={{ color: "var(--text2)" }}>Événement</span>
                  <strong style={{ textAlign: "right" }}>{evenement.titre}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 4 }}>
                  <span style={{ color: "var(--text2)" }}>Catégorie</span>
                  <strong style={{ textAlign: "right" }}>{selectedCategorie.nom}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 4 }}>
                  <span style={{ color: "var(--text2)" }}>Quantité</span>
                  <strong style={{ textAlign: "right" }}>x{quantite}</strong>
                </div>
                <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700 }}>Total</span>
                  
                  {/* ✅ AFFICHAGE DU TOTAL MODALE : GRATUIT pour stetw vérifié, prix normal sinon */}
                  {isStetwVerified ? (
                    <strong style={{ color: "#00e676", fontSize: 18 }}>GRATUIT 🎁</strong>
                  ) : (
                    <strong style={{ color: "var(--gold)", fontSize: 18 }}>{total.toLocaleString()} FCFA</strong>
                  )}
                  
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                <button onClick={() => setShowModal(false)} className="btn-outline" style={{ width: "100%", padding: "12px" }}>Annuler</button>
                <button onClick={confirmerAchat} disabled={loading} className="btn-primary" style={{ width: "100%", padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading ? "⏳ Traitement..." : "✅ Confirmer et Payer"}
                </button>
              </div>
            </div>
          </div>
        )}

        <AuthModal 
          isOpen={showAuth} 
          onClose={() => setShowAuth(false)} 
          onLoginSuccess={(user) => { 
            if (user) {
              setLocalUser(user);
              localStorage.setItem('user', JSON.stringify(user));
            }
            setShowAuth(false); 
            setTimeout(() => {
              if (selectedCategorie) {
                setShowModal(true);
              }
            }, 100);
          }} 
        />
      </div>
    </>
  );
};

export default EvenementDetail;