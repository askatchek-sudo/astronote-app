import React, { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    return () => clearInterval(timer);
  }, []);

  const textToDisplay = "ASTRONOTE...".split("");

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#080b18',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      {/* Astronaute - espace réduit avec marginBottom: 5 */}
      <div style={{
        marginBottom: 5,
        position: 'relative',
        animation: 'bodyBounce 1.2s ease-in-out infinite'
      }}>
        <svg width="140" height="150" viewBox="0 0 140 150">
          {/* Notes de musique */}
          <g>
            <text x="10" y="15" fontSize="20" fill="#06b6d4" style={{ animation: 'floatNote1 2s ease-in-out infinite' }}>🎵</text>
            <text x="80" y="10" fontSize="18" fill="#7c3aed" style={{ animation: 'floatNote2 2.3s ease-in-out infinite' }}></text>
            <text x="100" y="35" fontSize="16" fill="#ec4899" style={{ animation: 'floatNote3 1.9s ease-in-out infinite' }}>♪</text>
            <text x="0" y="45" fontSize="18" fill="#f59e0b" style={{ animation: 'floatNote1 2.1s ease-in-out infinite reverse' }}>♫</text>
          </g>

          {/* JAMBE ARRIÈRE (droite, sombre) */}
          <g style={{ transformOrigin: '78px 95px', animation: 'swingThighBack 1.2s ease-in-out infinite' }}>
            <rect x="72" y="95" width="10" height="18" rx="4" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="77" cy="115" r="4" fill="#64748b" />
            <g style={{ transformOrigin: '77px 115px', animation: 'swingShinBack 1.2s ease-in-out infinite' }}>
              <rect x="72" y="115" width="10" height="18" rx="4" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
              <ellipse cx="77" cy="135" rx="7" ry="4" fill="#0891b2" />
            </g>
          </g>

          {/* BRAS ARRIÈRE (droit, sombre) */}
          <g style={{ transformOrigin: '82px 60px', animation: 'swingArmBack 1.2s ease-in-out infinite' }}>
            <rect x="78" y="60" width="9" height="26" rx="4" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="82" cy="88" r="5" fill="#cbd5e1" />
          </g>

          {/* Corps */}
          <ellipse cx="70" cy="80" rx="22" ry="28" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />

          {/* Casque (inchangé) */}
          <ellipse cx="70" cy="40" rx="20" ry="22" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          
          {/* ✅ TÊTE TOURNÉE : Visière et reflet déplacés à droite (cx="80" et cx="82") */}
          <ellipse cx="80" cy="38" rx="12" ry="15" fill="#1e293b" />
          <ellipse cx="82" cy="36" rx="5" ry="7" fill="#06b6d4" opacity="0.5" />
          
          {/* Col du casque (inchangé) */}
          <ellipse cx="70" cy="60" rx="15" ry="4" fill="#94a3b8" />

          {/* BRAS AVANT (gauche, clair) */}
          <g style={{ transformOrigin: '58px 60px', animation: 'swingArmFront 1.2s ease-in-out infinite' }}>
            <rect x="50" y="60" width="11" height="28" rx="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="55" cy="90" r="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
          </g>

          {/* JAMBE AVANT (gauche, claire) */}
          <g style={{ transformOrigin: '62px 95px', animation: 'swingThighFront 1.2s ease-in-out infinite' }}>
            <rect x="58" y="95" width="12" height="20" rx="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="64" cy="117" r="5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            <g style={{ transformOrigin: '64px 117px', animation: 'swingShinFront 1.2s ease-in-out infinite' }}>
              <rect x="58" y="117" width="12" height="20" rx="5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
              <ellipse cx="64" cy="139" rx="9" ry="5" fill="#06b6d4" />
            </g>
          </g>
        </svg>
      </div>

      {/* TEXTE ASTRONOTE... */}
      <div style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 32,
        fontWeight: 900,
        letterSpacing: 6,
        display: 'flex',
        justifyContent: 'center'
      }}>
        {textToDisplay.map((char, index) => {
          const charThreshold = ((index + 1) / textToDisplay.length) * 100;
          const isLit = progress >= charThreshold;

          return (
            <span
              key={index}
              style={{
                color: isLit ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)',
                textShadow: isLit 
                  ? '0 0 15px rgba(6, 182, 212, 0.8), 0 0 30px rgba(124, 58, 237, 0.6)' 
                  : 'none',
                transition: 'all 0.3s ease-out',
                display: 'inline-block',
                transform: isLit ? 'translateY(-4px)' : 'translateY(0px)',
                animation: isLit && progress === Math.round(charThreshold) ? 'letterPop 0.3s ease-out' : 'none'
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      <style>{`
        @keyframes swingArmFront {
          0% { transform: rotate(40deg); }
          50% { transform: rotate(-40deg); }
          100% { transform: rotate(40deg); }
        }
        @keyframes swingArmBack {
          0% { transform: rotate(-40deg); }
          50% { transform: rotate(40deg); }
          100% { transform: rotate(-40deg); }
        }
        @keyframes swingThighFront {
          0% { transform: rotate(35deg); }
          50% { transform: rotate(-35deg); }
          100% { transform: rotate(35deg); }
        }
        @keyframes swingShinFront {
          0% { transform: rotate(10deg); }
          25% { transform: rotate(0deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(45deg); }
          100% { transform: rotate(10deg); }
        }
        @keyframes swingThighBack {
          0% { transform: rotate(-35deg); }
          50% { transform: rotate(35deg); }
          100% { transform: rotate(-35deg); }
        }
        @keyframes swingShinBack {
          0% { transform: rotate(45deg); }
          25% { transform: rotate(0deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(10deg); }
          100% { transform: rotate(45deg); }
        }
        @keyframes bodyBounce {
          0% { transform: translateY(0px); }
          25% { transform: translateY(-10px); }
          50% { transform: translateY(0px); }
          75% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes floatNote1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-12px) rotate(15deg); opacity: 0.7; }
        }
        @keyframes floatNote2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-15px) rotate(-15deg); opacity: 0.8; }
        }
        @keyframes floatNote3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-8px) rotate(20deg); opacity: 0.6; }
        }
        @keyframes letterPop {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.2); }
          100% { transform: translateY(-4px) scale(1); }
        }
      `}</style>
    </div>
  );
}