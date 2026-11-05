import logo from '../assets/logo.png';

const Footer = ({ setPage }) => (
  <>
    {/* ✅ CSS RESPONSIVE POUR LE FOOTER */}
    <style>{`
      .footer-container { padding: 48px 20px 24px !important; }
      .footer-grid { 
        grid-template-columns: 1fr !important; 
        gap: 32px !important; 
        text-align: center !important; 
      }
      .footer-logo-block { justify-content: center !important; }
      .footer-bottom { 
        flex-direction: column !important; 
        text-align: center !important; 
        gap: 16px !important; 
      }
      
      @media (min-width: 768px) {
        .footer-container { padding: 48px 40px 32px !important; }
        .footer-grid { 
          grid-template-columns: 2fr 1fr 1fr 1fr !important; 
          gap: 40px !important; 
          text-align: left !important; 
        }
        .footer-logo-block { justify-content: flex-start !important; }
        .footer-bottom { 
          flex-direction: row !important; 
          text-align: left !important; 
          gap: 12px !important; 
        }
      }
    `}</style>

    <footer className="footer-container" style={{ borderTop: "1px solid var(--border)", marginTop: 40, background: "var(--bg-elevated, transparent)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* GRILLE PRINCIPALE DU FOOTER */}
        <div className="footer-grid" style={{ display: "grid", marginBottom: 40 }}>
          
          {/* COLONNE 1 : LOGO & DESCRIPTION */}
          <div>
            <div className="footer-logo-block" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <img 
                src={logo} 
                alt="ASTRONOTE" 
                style={{ 
                  height: 40,
                  width: "auto", 
                  filter: "drop-shadow(0 0 8px rgba(6, 182, 212, 0.3))" 
                }} 
              />
              <span style={{ 
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 3,
                background: 'linear-gradient(90deg, var(--accent2), var(--cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ASTRONOTE
              </span>
            </div>
            
            <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.7, maxWidth: 280, margin: "0 auto" }}>
              Label de distribution musicale propulsant les artistes d'Afrique et du monde vers les étoiles.
            </p>
          </div>
          
          {/* COLONNES 2, 3, 4 : LIENS */}
          {[
            { titre: "Navigation", liens: [["Accueil", "accueil"], ["Artistes", "artistes"], ["Actualités", "actualites"], ["Distribution", "distribution"], ["Contact", "contact"]] },
            { titre: "Services", liens: [["Distribution Digitale", null], ["Production & Mixing", null], ["Marketing & Promo", null], ["Droits & Licences", null]] },
            { titre: "Contact", liens: [["contact@astronote.music", null], ["Ebolowa, Cameroun", null], ["Instagram", null], ["YouTube", null]] },
          ].map(col => (
            <div key={col.titre}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, letterSpacing: 3, color: "var(--text2)", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>
                {col.titre}
              </div>
              {col.liens.map(([lb, pg]) => (
                <div 
                  key={lb} 
                  onClick={() => pg && setPage(pg)} 
                  style={{ 
                    fontSize: 13, 
                    color: "var(--text2)", 
                    cursor: pg ? "pointer" : "default", 
                    marginBottom: 10, 
                    transition: "color .2s" 
                  }}
                  onMouseOver={e => pg && (e.currentTarget.style.color = "var(--accent2)")} 
                  onMouseOut={e => pg && (e.currentTarget.style.color = "var(--text2)")}
                >
                  {lb}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* BAS DE PAGE : COPYRIGHT */}
        <div className="footer-bottom" style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "var(--text2)", fontFamily: "'Space Mono',monospace" }}>
            © 2026 ASTRONOTE — Tous droits réservés
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)" }}>
            Conçu avec ✦ pour les artistes du monde
          </div>
        </div>
        
      </div>
    </footer>
  </>
);

export default Footer;