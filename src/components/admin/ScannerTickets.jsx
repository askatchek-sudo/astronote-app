import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const ScannerTickets = () => {
  const [code, setCode] = useState("");
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannerActif, setScannerActif] = useState(false);
  const [erreur, setErreur] = useState("");
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Fonction de vérification
  const verifierTicket = async (codeAVerifier) => {
    if (!codeAVerifier.trim()) {
      setErreur("Veuillez entrer un code.");
      return;
    }

    setLoading(true);
    setErreur("");
    setResultat(null);

    try {
      const res = await fetch("http://localhost:3001/api/evenements/verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeAVerifier })
      });

      const data = await res.json();
      setResultat(data);
    } catch (error) {
      setErreur("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Démarrer le scanner caméra
  const demarrerScanner = async () => {
    setErreur("");
    try {
      html5QrCodeRef.current = new Html5Qrcode("reader");
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // QR code détecté !
          setCode(decodedText);
          verifierTicket(decodedText);
          arreterScanner();
        },
        (errorMessage) => {
          // Erreur de lecture (ignorée silencieusement)
        }
      );
      setScannerActif(true);
    } catch (err) {
      setErreur("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      console.error(err);
    }
  };

  // Arrêter le scanner
  const arreterScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error(err);
      }
    }
    setScannerActif(false);
  };

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    verifierTicket(code);
  };

  const reset = () => {
    setResultat(null);
    setCode("");
    setErreur("");
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 3, marginBottom: 8 }} className="glow-text">
         SCANNER DE TICKETS
      </div>
      <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 32 }}>
        Scannez les QR codes à l'entrée de l'événement
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* ─── SCANNER CAMÉRA ─── */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, marginBottom: 16, color: "var(--cyan)" }}>
            📱 Scan par caméra
          </h3>
          
          <div id="reader" ref={scannerRef} style={{ 
            width: "100%", 
            minHeight: 250, 
            background: "#000", 
            borderRadius: 12, 
            overflow: "hidden",
            marginBottom: 16
          }}></div>

          {!scannerActif ? (
            <button onClick={demarrerScanner} className="btn-primary" style={{ width: "100%" }}>
               Activer la caméra
            </button>
          ) : (
            <button onClick={arreterScanner} className="btn-outline" style={{ width: "100%", borderColor: "var(--pink)", color: "var(--pink)" }}>
              ⏹ Arrêter la caméra
            </button>
          )}

          <div style={{ marginTop: 16, padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 8, fontSize: 12, color: "var(--text2)" }}>
            💡 <strong>Astuce :</strong> Pointez le QR code du ticket vers la caméra. Le scan est automatique.
          </div>
        </div>

        {/* ─── SAISIE MANUELLE ─── */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, marginBottom: 16, color: "var(--accent2)" }}>
            ⌨️ Saisie manuelle
          </h3>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, display: "block" }}>
              Code du ticket
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ASTRO-XXXXX-XXXX"
              style={{
                width: "100%",
                padding: "14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                color: "var(--text)",
                fontFamily: "'Space Mono',monospace",
                fontSize: 14,
                letterSpacing: 1,
                outline: "none",
                marginBottom: 16
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !code} 
              className="btn-primary" 
              style={{ width: "100%", opacity: loading || !code ? 0.5 : 1 }}
            >
              {loading ? "⏳ Vérification..." : "🔍 Vérifier le ticket"}
            </button>
          </form>

          <div style={{ marginTop: 16, padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 8, fontSize: 12, color: "var(--text2)" }}>
            💡 <strong>Astuce :</strong> Copiez-collez le code unique du ticket si le QR code est illisible.
          </div>
        </div>
      </div>

      {/* ─── RÉSULTAT DU SCAN ─── */}
      {resultat && (
        <div style={{ 
          marginTop: 32, 
          padding: 32, 
          borderRadius: 16, 
          border: `3px solid ${resultat.valide ? "var(--vert)" : "var(--pink)"}`,
          background: resultat.valide ? "rgba(0,230,118,0.08)" : "rgba(236,72,153,0.08)",
          animation: "fadeUp 0.4s ease both",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>
            {resultat.valide ? "✅" : "❌"}
          </div>
          <div style={{ 
            fontFamily: "'Orbitron',sans-serif", 
            fontSize: 28, 
            fontWeight: 900, 
            color: resultat.valide ? "var(--vert)" : "var(--pink)",
            marginBottom: 16,
            letterSpacing: 2
          }}>
            {resultat.valide ? "TICKET VALIDE" : "TICKET INVALIDE"}
          </div>
          <div style={{ fontSize: 16, color: "var(--text)", marginBottom: 24 }}>
            {resultat.message}
          </div>

          {resultat.ticket && (
            <div style={{ 
              background: "rgba(0,0,0,0.4)", 
              padding: 20, 
              borderRadius: 12, 
              textAlign: "left",
              maxWidth: 500,
              margin: "0 auto"
            }}>
              <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text2)" }}>Événement :</span>
                  <strong>{resultat.ticket.evenement}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text2)" }}>Catégorie :</span>
                  <strong style={{ color: "var(--cyan)" }}>{resultat.ticket.categorie}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text2)" }}>Acheteur :</span>
                  <strong>{resultat.ticket.acheteur}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text2)" }}>Code :</span>
                  <strong style={{ fontFamily: "'Space Mono',monospace", fontSize: 12 }}>{resultat.ticket.code}</strong>
                </div>
                {resultat.ticket.dateValidation && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4 }}>
                    <span style={{ color: "var(--text2)" }}>Validé à :</span>
                    <strong style={{ color: "var(--vert)" }}>{resultat.ticket.dateValidation}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          <button 
            onClick={reset} 
            className="btn-outline" 
            style={{ marginTop: 24 }}
          >
            🔄 Scanner un nouveau ticket
          </button>
        </div>
      )}

      {erreur && (
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: "rgba(236,72,153,0.1)", 
          border: "1px solid var(--pink)", 
          borderRadius: 10, 
          color: "var(--pink)",
          textAlign: "center"
        }}>
          ⚠️ {erreur}
        </div>
      )}
    </div>
  );
};

export default ScannerTickets;