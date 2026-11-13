import React, { useState, useEffect } from 'react';

// ✅ CORRECTION : Utilise la variable d'environnement pour la production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ✅ Fonction robuste pour gérer TOUS les formats d'URL d'image
const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  // ✅ CORRECTION : Utilise API_URL au lieu de localhost en dur
  if (img.startsWith('/uploads/')) return `${API_URL}${img}`;
  if (img.includes('/uploads/')) return `${API_URL}/${img.replace(/^\//, '')}`;
  // Fallback : si c'est juste un nom de fichier, on suppose qu'il est dans le dossier /uploads/
  return `${API_URL}/uploads/${img}`;
};

export default function SectionActualites() {
  const [actualites, setActualites] = useState([]);
  const [classement, setClassement] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Auto-play du diaporama
  useEffect(() => {
    if (actualites.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % actualites.length);
    }, 5000); // Change toutes les 5 secondes
    return () => clearInterval(interval);
  }, [actualites.length]);

  const chargerDonnees = async () => {
    try {
      // ✅ CORRECTION : Ajout de '/api' pour être cohérent avec le reste de l'application
      const [actRes, classRes] = await Promise.all([
        fetch(`${API_URL}/api/actualites`),
        fetch(`${API_URL}/api/actualites/classement`)
      ]);
      const actData = await actRes.json();
      const classData = await classRes.json();
      setActualites(actData);
      setClassement(classData);
    } catch (error) {
      console.error('Erreur chargement actualités:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <section style={{ padding: '80px 40px', background: 'linear-gradient(180deg, transparent, rgba(124,58,237,0.03), transparent)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* TITRE DE LA SECTION */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="section-tag">Actualités</div>
          <h2 className="section-title">Les <span className="glow-text">nouvelles</span> du moment</h2>
        </div>

        {/* DIAPORAMA */}
        {actualites.length > 0 && (
          <div style={{ marginBottom: 80, position: 'relative' }}>
            <div style={{ position: 'relative', width: '100%', height: 400, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              {actualites.map((act, index) => {
                const imageUrl = getImageUrl(act.imageUrl);
                return (
                  <div
                    key={act.id}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: index === currentSlide ? 1 : 0,
                      transition: 'opacity 0.8s ease-in-out',
                      background: imageUrl ? '#1a1a2e' : 'linear-gradient(135deg, var(--accent), var(--cyan))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={act.titre} 
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          console.warn(`⚠️ Échec du chargement de l'image : ${imageUrl}`);
                          e.target.style.display = 'none'; // Cache l'image cassée
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 80, opacity: 0.3 }}>📰</div>
                    )}
                    
                    {/* Overlay dégradé pour la lisibilité du texte */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,11,24,0.95) 0%, rgba(8,11,24,0.3) 50%, rgba(8,11,24,0.1) 100%)' }} />
                    
                    <div style={{ position: 'relative', zIndex: 2, padding: '40px', textAlign: 'center', maxWidth: 700 }}>
                      <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, marginBottom: 16, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                        {act.titre}
                      </h3>
                      {act.description && (
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, marginBottom: 24 }}>
                          {act.description}
                        </p>
                      )}
                      {act.lien && (
                        <a href={act.lien} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                          En savoir plus →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Contrôles du diaporama */}
              {actualites.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide(prev => (prev - 1 + actualites.length) % actualites.length)}
                    style={{
                      position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                      width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 20,
                      cursor: 'pointer', backdropFilter: 'blur(10px)', zIndex: 3
                    }}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentSlide(prev => (prev + 1) % actualites.length)}
                    style={{
                      position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                      width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 20,
                      cursor: 'pointer', backdropFilter: 'blur(10px)', zIndex: 3
                    }}
                  >
                    →
                  </button>

                  {/* Indicateurs */}
                  <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 3 }}>
                    {actualites.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        style={{
                          width: index === currentSlide ? 32 : 10,
                          height: 10,
                          borderRadius: 5,
                          background: index === currentSlide ? 'var(--cyan)' : 'rgba(255,255,255,0.4)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* CLASSEMENT DES ARTISTES */}
        {classement && classement.top5.length > 0 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
                🏆 Classement {classement.type}
              </div>
              <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, letterSpacing: 2 }} className="glow-text">
                TOP 5 ARTISTES {classement.type === 'annuel' ? 'DE L\'ANNÉE' : 'DU MOIS'}
              </h3>
              <div style={{ fontSize: 14, color: 'var(--accent2)', marginTop: 8, fontWeight: 600 }}>
                {classement.periode}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              {classement.top5.map((artiste, index) => {
                const imageUrl = getImageUrl(artiste.img);
                const medailles = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                const couleurs = ['#FFD700', '#C0C0C0', '#CD7F32', 'var(--cyan)', 'var(--cyan)'];
                
                return (
                  <div
                    key={artiste.id}
                    className="glass-card"
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      border: `2px solid ${couleurs[index]}`,
                      background: `linear-gradient(135deg, ${couleurs[index]}10, transparent)`,
                      animation: `fadeUp 0.6s ${index * 0.1}s ease both`,
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-6px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>{medailles[index]}</div>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px', background: imageUrl ? '#1a1a2e' : 'linear-gradient(135deg, var(--accent), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `3px solid ${couleurs[index]}` }}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={artiste.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 32 }}>{artiste.img || '🎤'}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
                      {artiste.nom}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--accent2)', marginBottom: 12 }}>
                      {artiste.genre}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
                      {artiste.nombreMorceaux} titre{artiste.nombreMorceaux > 1 ? 's' : ''}
                    </div>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: couleurs[index] }}>
                      {Number(artiste.streams).toLocaleString('fr-FR')}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1 }}>
                      streams
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}