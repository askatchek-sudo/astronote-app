import { useState } from "react";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const subscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }
    
    setStatus("loading");
    
    // Sauvegarder dans localStorage
    try {
      const subscribers = JSON.parse(localStorage.getItem("astronote_newsletter") || "[]");
      if (subscribers.includes(email)) {
        setStatus("error");
        return;
      }
      subscribers.push(email);
      localStorage.setItem("astronote_newsletter", JSON.stringify(subscribers));
      
      setTimeout(() => {
        setStatus("success");
        setEmail("");
      }, 800);
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={{
        padding: "20px",
        background: "rgba(0,230,118,0.1)",
        border: "1px solid rgba(0,230,118,0.3)",
        borderRadius: 12,
        textAlign: "center",
        animation: "fadeUp 0.5s ease"
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
        <div style={{ color: "var(--vert)", fontWeight: 700, marginBottom: 4 }}>
          Inscription réussie !
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)" }}>
          Bienvenue dans l'univers ASTRONOTE ✦
        </div>
        <button
          onClick={() => setStatus("idle")}
          style={{
            marginTop: 12,
            background: "none",
            border: "none",
            color: "var(--accent2)",
            cursor: "pointer",
            fontSize: 12,
            textDecoration: "underline"
          }}
        >
          Inscrire un autre email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={subscribe} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          style={{ flex: 1, margin: 0 }}
          disabled={status === "loading"}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={status === "loading"}
          style={{ padding: "12px 24px", whiteSpace: "nowrap" }}
        >
          {status === "loading" ? "..." : "✦ S'abonner"}
        </button>
      </div>
      {status === "error" && (
        <div style={{ fontSize: 12, color: "var(--pink)" }}>
          ⚠ Email invalide ou déjà inscrit
        </div>
      )}
      <div style={{ fontSize: 11, color: "var(--text2)" }}>
        Recevez nos actualités, sorties et événements exclusifs ✦
      </div>
    </form>
  );
};

export default NewsletterForm;