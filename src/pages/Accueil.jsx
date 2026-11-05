import { useState, useEffect } from "react";
import { SERVICES } from "../data/initialData";
import { achatsAPI } from "../lib/api";
import logo from '../assets/logo.png';
import SectionActualites from '../components/SectionActualites';

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/uploads/')) return `http://localhost:3001${img}`;
  if (img.includes('/uploads/')) return `http://localhost:3001/${img.replace(/^\//, '')}`;
  return null;
};

const getDateOnly = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

const Accueil = ({ setPage, artistes, evenements = [], onOpenAuth, setArtisteSelectionne, setEvenementSelectionne}) => {
  const [count, setCount] = useState({ artistes: 0, streams: 0, labels: 0 });

  useEffect(() => {
    const targets = { artistes: artistes.length || 6, streams: 13, labels: 150 };
    const duration = 2000, steps = 60;
    let step = 0;
    const iv = setInterval(() => {
      step++;
      const progress = step / steps;
      setCount({
        artistes: Math.round(targets.artistes * Math.min(progress, 1)),
        streams: Math.round(targets.streams * Math.min(progress, 1)),
        labels: Math.round(targets.labels * Math.min(progress, 1)),
      });
      if (step >= steps) clearInterval(iv);
    }, duration / steps);
    return () => clearInterval(iv);
  }, [artistes.length]);

  const evenementsTries = [...evenements].sort((a, b) => {
    return getDateOnly(a.date).getTime() - getDateOnly(b.date).getTime();
  });

  const maintenant = new Date();
  maintenant.setHours(0, 0, 0, 0);

  const prochainEvent = evenementsTries.find(ev => getDateOnly(ev.date) >= maintenant);
  const autresEvents = evenementsTries.filter(ev => ev.id !== prochainEvent?.id);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  };

  // ─── Vérification connexion pour réservation ───────────
  const handleReservationClick = (ev) => {
    const userStr = localStorage.getItem("user");
    let isFan = false;

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.role !== "ADMIN" && user.email !== "admin@astronote.music") {
          isFan = true;
        }
      } catch (e) {
        isFan = false;
      }
    }

    if (!isFan) {
      console.log(" Pas de fan connecté → ouverture modale pour réserver");
      if (typeof onOpenAuth === "function") {
        onOpenAuth();
      }
      return;
    }

    console.log("✅ Fan connecté → réservation");
    alert(`🎟 Réservation lancée pour : ${ev.titre}`);
  };

  return (
    <div>
      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 40px 80px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(124,58,237,0.08)", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 480, height: 480, marginTop: -240, marginLeft: -240, borderRadius: "50%", border: "1px solid rgba(6,182,212,0.06)" }} />
          <div style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", background: "var(--cyan)", boxShadow: "0 0 10px var(--cyan)", animation: "orbit 8s linear infinite" }} />
        </div>

        <div style={{ maxWidth: 800, animation: "fadeUp 1s ease both" }}>
          <div className="section-tag" style={{ marginBottom: 24 }}> Label de Distribution Musicale</div>
          
          {/* ✅ Logo + Texte ASTRONOTE alignés horizontalement */}
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
            <img 
              src={logo} 
              alt="ASTRONOTE" 
              style={{ 
                height: 80,
                width: "auto", 
                animation: "float 4s ease-in-out infinite",
                filter: "drop-shadow(0 0 20px rgba(6, 182, 212, 0.4))"
              }} 
            />
            <span style={{ 
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: 6,
              background: 'linear-gradient(90deg, var(--accent2), var(--cyan))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: "fadeUp 1.2s ease both"
            }}>
              ASTRONOTE
            </span>
          </div>

          <p style={{ fontSize: "clamp(16px,2vw,20px)", color: "var(--text2)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 40px", fontWeight: 300 }}>
            Nous propulsons les artistes vers de nouveaux horizons. Distribution mondiale, production d'excellence et stratégie marketing pour faire résonner votre musique à travers l'univers.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => setPage("distribution")}>🚀 Distribuer ma musique</button>
            <button className="btn-outline" onClick={() => setPage("artistes")}>Découvrir nos artistes →</button>
          </div>
        </div>
      </section>

      {/* ✅ SECTION ACTUALITÉS : Placée tout en haut, juste après le Hero */}
      <SectionActualites />

      {/* Stats */}
      <section style={{ padding: "60px 40px", position: "relative" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 2 }}>
          {[
            { val: `${count.artistes}+`, label: "Artistes signés", icon: "🎤" },
            { val: `${count.streams}M+`, label: "Streams cumulés", icon: "🎧" },
            { val: `${count.labels}+`, label: "Plateformes partenaires", icon: "🌍" },
            { val: "5 ans", label: "D'expérience", icon: "⭐" },
          ].map((s, i) => (
            <div key={i} className="glass-card scanline" style={{ padding: "32px 24px", textAlign: "center", borderRadius: i === 0 ? "16px 0 0 16px" : i === 3 ? "0 16px 16px 0" : "0", animation: `fadeUp 0.8s ${i * 0.15}s ease both` }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(28px,4vw,40px)", fontWeight: 900, marginBottom: 6 }} className="glow-text-gold">{s.val}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured artists - CLIQUABLES VERS PAGE DÉTAIL */}
      <section style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="section-tag">Nos artistes</div>
            <h2 className="section-title">Talents <span className="glow-text">d'exception</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {artistes.slice(0, 3).map((a, i) => {
              const imgUrl = getImageUrl(a.img);
              return (
                <div
                  key={a.id}
                  className="glass-card"
                  style={{
                    padding: "28px",
                    animation: `fadeUp 0.8s ${i * 0.1}s ease both`,
                    cursor: "pointer",
                    transition: "transform 0.2s"
                  }}
                  onClick={() => {
                    console.log("🎯 Clic sur artiste depuis accueil :", a.nom);
                    if (typeof setArtisteSelectionne === "function") {
                      setArtisteSelectionne(a.id);
                    }
                    if (typeof setPage === "function") {
                      setPage("artiste-detail");
                    }
                    window.scrollTo(0, 0);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-6px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: imgUrl ? '#1a1a2e' : "linear-gradient(135deg,var(--accent),var(--cyan))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, overflow: "hidden"
                    }}>
                      {imgUrl ? (
                        <img src={imgUrl} alt={a.nom} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <span style={{ lineHeight: 1, fontSize: 24 }}>{a.img || "🎵"}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: 2 }}>{a.nom}</div>
                      <div style={{ fontSize: 12, color: "var(--accent2)", marginTop: 2 }}>{a.genre}</div>
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 20 }}>{a.pays}</div>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, marginBottom: 16 }}>
                    {a.bio.length > 120 ? a.bio.substring(0, 120) + "..." : a.bio}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>
                      <span style={{ color: "var(--cyan)", fontWeight: 600 }}>{a.tracks}</span> titres
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>
                      <span style={{ color: "var(--cyan)", fontWeight: 600 }}>{a.streams}</span> streams
                    </span>
                  </div>
                  <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "var(--accent2)", fontWeight: 600 }}>
                    Voir la fiche complète →
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button className="btn-outline" onClick={() => setPage("artistes")}>Voir tous nos artistes →</button>
          </div>
        </div>
      </section>

      {/* Services aperçu */}
      <section style={{ padding: "80px 40px", background: "linear-gradient(180deg,transparent,rgba(124,58,237,0.05),transparent)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="section-tag">Nos services</div>
            <h2 className="section-title">Une galaxie de <span className="glow-text">services</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
            {SERVICES.slice(0, 3).map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: "28px", display: "flex", gap: 18, animation: `fadeUp 0.8s ${i * 0.1}s ease both` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.ic}</div>
                <div>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{s.titre}</div>
                  <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button className="btn-primary" onClick={() => setPage("services")}>🚀 Voir tous les services</button>
          </div>
        </div>
      </section>

      {/* Événements */}
      {evenementsTries.length > 0 && (
        <section style={{ padding: "80px 0", background: "linear-gradient(180deg,transparent,rgba(236,72,153,0.04),transparent)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div className="section-tag" style={{ color: "var(--pink)", borderColor: "rgba(236,72,153,0.3)", background: "rgba(236,72,153,0.08)" }}>Agenda</div>
              <h2 className="section-title">
                Nos <span style={{ background: "linear-gradient(135deg,var(--pink),var(--accent))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Événements</span>
              </h2>
              <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>Concerts, soirées et festivals à venir.</p>
            </div>

            {/* GRANDE AFFICHE CINÉMATIQUE */}
            {prochainEvent && (() => {
              const coverUrl = getImageUrl(prochainEvent.coverUrl);
              return (
                <div style={{ marginBottom: 48, animation: "fadeUp 0.8s ease both" }}>
                  <div style={{ position: "relative", width: "100%", height: 550, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(236,72,153,0.3)", border: "1px solid rgba(236,72,153,0.3)" }}>
                    {coverUrl ? (
                      <img src={coverUrl} alt={prochainEvent.titre} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(236,72,153,0.4),rgba(124,58,237,0.4))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 150, lineHeight: 1 }}>{prochainEvent.coverEmoji || "🎤"}</span>
                      </div>
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,11,24,0.1) 0%, rgba(8,11,24,0.3) 40%, rgba(8,11,24,0.85) 75%, rgba(8,11,24,0.98) 100%)" }} />
                    <div style={{ position: "absolute", top: 24, left: 24, padding: "8px 20px", background: "linear-gradient(135deg,var(--pink),var(--accent))", borderRadius: 50, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#fff", boxShadow: "0 4px 20px rgba(236,72,153,0.5)", zIndex: 2 }}>
                      ⭐ Prochain événement
                    </div>
                    <div style={{ position: "absolute", top: 24, right: 24, padding: "8px 18px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 50, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "#fff", zIndex: 2 }}>
                      {prochainEvent.type || "Événement"}
                    </div>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 40px 36px", zIndex: 2 }}>
                      <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, letterSpacing: 2, marginBottom: 16, lineHeight: 1.1, color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                        {prochainEvent.titre}
                      </h3>
                      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 15, color: "rgba(255,255,255,0.9)", marginBottom: 20 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>📅 <strong style={{ color: "var(--pink)" }}>{formatDate(prochainEvent.date)}</strong> à {prochainEvent.heure || "20:00"}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>📍 {prochainEvent.lieu} {prochainEvent.pays}</span>
                      </div>
                      {prochainEvent.description && (
                        <p style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.6, fontSize: 14, marginBottom: 24, maxWidth: 700, textShadow: "0 1px 10px rgba(0,0,0,0.5)" }}>
                          {prochainEvent.description}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                        {prochainEvent.prix && (
                          <div style={{ textAlign: "center", background: "rgba(236,72,153,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(236,72,153,0.4)", borderRadius: 14, padding: "14px 24px" }}>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Entrée</div>
                            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--pink)" }}>{Number(prochainEvent.prix).toLocaleString("fr-FR")}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>FCFA</div>
                          </div>
                        )}
                        <button onClick={() => {
                                  console.log("🚀 Clic sur réserver (grand), ID :", prochainEvent.id);
                                     if (typeof setEvenementSelectionne === "function") {
                                        setEvenementSelectionne(prochainEvent.id);
                                     } else {
                                       console.error("❌ setEvenementSelectionne n'est pas une fonction !");
                                     }
                                  setPage("evenement-detail");
                                    window.scrollTo(0, 0);
                                  }}
                            className="btn-primary"
                             style={{ background: "linear-gradient(135deg,var(--pink),var(--accent))", boxShadow: "0 4px 30px rgba(236,72,153,0.5)", padding: "16px 32px", fontSize: 14, fontWeight: 700, letterSpacing: 2 }}
                            >
                           Réserver ma place
                       </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Autres événements */}
            {autresEvents.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {autresEvents.map((ev, idx) => {
                  const coverUrl = getImageUrl(ev.coverUrl);
                  const dateEv = getDateOnly(ev.date);
                  const estPasse = dateEv < maintenant;
                  return (
                    <div key={ev.id} className="glass-card" style={{ overflow: "hidden", display: "flex", opacity: estPasse ? 0.55 : 1, animation: `fadeUp 0.6s ${idx * 0.1}s ease both` }}>
                      <div style={{ width: 120, height: 120, flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg,rgba(236,72,153,0.2),rgba(124,58,237,0.2))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {coverUrl ? (
                          <img src={coverUrl} alt={ev.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: 44, lineHeight: 1 }}>{ev.coverEmoji || "🎤"}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{ padding: "2px 10px", background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.25)", borderRadius: 20, fontSize: 10, color: "var(--pink)", fontWeight: 700, textTransform: "uppercase" }}>
                            {ev.type || "Événement"}
                          </span>
                          {estPasse && <span style={{ padding: "2px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 10, color: "var(--text2)", fontWeight: 700 }}>Terminé</span>}
                        </div>
                        <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{ev.titre}</h3>
                        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text2)", flexWrap: "wrap" }}>
                          <span>📅 {formatDate(ev.date)} à {ev.heure || "20:00"}</span>
                          <span>📍 {ev.lieu} {ev.pays}</span>
                          {ev.prix && <span style={{ color: "var(--pink)", fontWeight: 600 }}>🎟 {Number(ev.prix).toLocaleString("fr-FR")} FCFA</span>}
                        </div>
                      </div>
                      {!estPasse && (
                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <button onClick={() => {
                            console.log(" Clic sur réserver (liste), ID :", ev.id);
                            if (typeof setEvenementSelectionne === "function") {
                              setEvenementSelectionne(ev.id);
                            } else {
                            console.error("❌ setEvenementSelectionne n'est pas une fonction !");
                            }
                            setPage("evenement-detail");
                              window.scrollTo(0, 0);
                          }}
                          className="btn-outline"
                            style={{ borderColor: "rgba(236,72,153,0.4)", color: "var(--pink)", whiteSpace: "nowrap", padding: "10px 20px" }}
                          >
                           Réserver
                        </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA final */}
      <section style={{ padding: "100px 40px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),var(--cyan))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 32px", animation: "float 3s ease-in-out infinite", boxShadow: "0 0 40px var(--glow-v)" }}>✦</div>
          <h2 className="section-title">Prêt à conquérir <span className="glow-text">l'univers</span> ?</h2>
          <p style={{ fontSize: 16, color: "var(--text2)", lineHeight: 1.7, marginBottom: 36 }}>Rejoignez ASTRONOTE et laissez votre musique résonner aux quatre coins du cosmos.</p>
          <button className="btn-primary" onClick={() => setPage("contact")} style={{ fontSize: 14, padding: "16px 40px" }}>✦ Soumettre mon dossier</button>
        </div>
      </section>
    </div>
  );
};

export default Accueil;