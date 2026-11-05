import { useState } from "react";

const Services = ({ setPage }) => {
  const servicesList = [
    // 🎵 SERVICES MUSICHAUX
    {
      icon: "🌍",
      title: "Distribution Digitale",
      description: "Diffusez votre musique sur plus de 150 plateformes mondiales (Spotify, Apple Music, Deezer, Boomplay, etc.) et touchez un public international."
    },
    {
      icon: "📈",
      title: "Marketing & Promotion",
      description: "Boostez votre visibilité avec nos campagnes de playlisting, relations presse et stratégies de réseaux sociaux ciblées pour faire décoller vos streams."
    },
    {
      icon: "️⚖️",
      title: "Gestion des Droits",
      description: "Nous protégeons vos œuvres et collectons vos redevances (SACEM, droits voisins, YouTube Content ID) pour que vous soyez rémunéré à chaque écoute."
    },
    {
      icon: "🎙️",
      title: "Production & Studio",
      description: "Accédez à nos studios partenaires pour l'enregistrement, le mixage et le mastering. Donnez à vos sons la qualité professionnelle qu'ils méritent."
    },
    {
      icon: "🎪",
      title: "Événementiel & Booking",
      description: "Organisation de concerts, tournées et showcases. Notre équipe vous accompagne pour faire vibrer le public en live et développer votre fanbase."
    },
    {
      icon: "💰",
      title: "Monétisation & Merch",
      description: "Développez vos revenus au-delà du streaming grâce à la vente de produits dérivés (merchandising) et à l'optimisation de vos chaînes numériques."
    },

    // 🎨 NOUVEAUX SERVICES AJOUTÉS
    {
      icon: "📸",
      title: "Shooting & Cover Art",
      description: "Conception de pochettes d'albums professionnelles, logos et séances photo promotionnelles pour donner une identité visuelle forte et unique à vos projets."
    },
    {
      icon: "📱",
      title: "Management Artistique",
      description: "Gestion complète de votre carrière, négociation de contrats, planification de projets et stratégie de développement à long terme avec un manager dédié."
    },
    {
      icon: "🎼",
      title: "Cours de Musique",
      description: "Formations personnalisées en chant, solfège, guitare, piano et autres instruments. Apprenez ou perfectionnez votre art avec des professeurs qualifiés."
    },
    {
      icon: "🎹",
      title: "Formation Beatmaking",
      description: "Apprenez à produire vos propres instrumentales sur FL Studio, Ableton ou Logic Pro. Maîtrisez le sound design, le mixage et l'arrangement avec nos experts."
    },
    {
      icon: "💻",
      title: "Développement Web & Logiciel",
      description: "Création de sites web, d'applications mobiles et de solutions logicielles sur mesure. Nous digitalisons votre activité avec des technologies modernes et performantes."
    }
  ];

  return (
    <div style={{ padding: "120px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      {/* En-tête */}
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <div className="section-tag">Ce que nous faisons</div>
        <h1 className="section-title">Nos <span className="glow-text">Services</span></h1>
        <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 700, margin: "16px auto 0", lineHeight: 1.6 }}>
          ASTRONOTE vous accompagne à chaque étape de votre carrière musicale et digitale, de la création du son jusqu'à son développement technique et commercial.
        </p>
      </div>

      {/* Grille des services */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24, marginBottom: 64 }}>
        {servicesList.map((service, index) => (
          <div 
            key={index} 
            className="glass-card" 
            style={{ 
              padding: 32, 
              transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
              border: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              flexDirection: "column"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(124, 58, 237, 0.2)";
              e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
            }}
          >
            <div style={{ 
              width: 64, 
              height: 64, 
              borderRadius: 16, 
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: 32, 
              marginBottom: 20,
              flexShrink: 0
            }}>
              {service.icon}
            </div>
            <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 12, color: "var(--text)" }}>
              {service.title}
            </h3>
            <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7, margin: 0, flex: 1 }}>
              {service.description}
            </p>
          </div>
        ))}
      </div>

      {/* Appel à l'action (CTA) */}
      <div className="glass-card" style={{ 
        padding: "48px 32px", 
        textAlign: "center", 
        background: "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))",
        border: "1px solid rgba(124,58,237,0.3)"
      }}>
        <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 900, marginBottom: 16 }}>
          Prêt à propulser votre projet ?
        </h2>
        <p style={{ color: "var(--text2)", fontSize: 16, marginBottom: 32, maxWidth: 500, margin: "0 auto 32px auto" }}>
          Notre équipe d'experts est prête à discuter de vos besoins et à trouver la solution adaptée, qu'elle soit musicale ou technique.
        </p>
        <button 
          onClick={() => setPage("contact")}
          className="btn-primary"
          style={{ 
            padding: "14px 32px", 
            fontSize: 15, 
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8
          }}
        >
          ✉️ Nous Contacter
        </button>
      </div>
    </div>
  );
};

export default Services;