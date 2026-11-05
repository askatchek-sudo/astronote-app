import { useState } from "react";
import { uploadAPI } from '../../lib/api'; // ✅ AJOUT DE uploadAPI

const EvenementsAdmin = ({ evenements, setEvenements, showToast }) => {
  const initForm = {
    titre: "",
    type: "concert",
    date: "",
    heure: "20:00",
    lieu: "",
    pays: "🇨🇮",
    description: "",
    coverUrl: "",
    coverEmoji: "🎤"
  };

  const [form, setForm] = useState(initForm);
  const [loading, setLoading] = useState(false);
  
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [categoriesTickets, setCategoriesTickets] = useState([
    { nom: "Standard", prix: "", placesTotales: "" }
  ]);

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 14px", color: "var(--text)", fontFamily: "'Exo 2',sans-serif",
    fontSize: 14, outline: "none", marginTop: 4, boxSizing: "border-box",
  };

  const labelStyle = { display: "block", fontSize: 11, color: "var(--text2)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 };

  const ajouterCategorie = () => {
    setCategoriesTickets([...categoriesTickets, { nom: "", prix: "", placesTotales: "" }]);
  };

  const supprimerCategorie = (index) => {
    if (categoriesTickets.length > 1) {
      const nouvelles = [...categoriesTickets];
      nouvelles.splice(index, 1);
      setCategoriesTickets(nouvelles);
    }
  };

  const updateCategorie = (index, champ, valeur) => {
    const nouvelles = [...categoriesTickets];
    nouvelles[index][champ] = valeur;
    setCategoriesTickets(nouvelles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre || !form.date || !form.lieu) {
      showToast("Veuillez remplir les champs obligatoires (Titre, Date, Lieu).", "error");
      return;
    }

    setLoading(true);
    try {
      let finalCoverUrl = form.coverUrl;

      // ✅ Upload via uploadAPI (gère automatiquement le token)
      if (coverFile) {
        showToast("⏳ Upload de l'image en cours...", "info");
        const uploadData = await uploadAPI.image(coverFile);
        finalCoverUrl = uploadData.url;
        showToast("✅ Image uploadée !", "success");
      }

      const categoriesValides = categoriesTickets.filter(c => c.nom && c.prix && c.placesTotales);

      const payload = {
        ...form,
        coverUrl: finalCoverUrl,
        categories: categoriesValides
      };

      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:3001/api/evenements", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la création");
      }

      const nouvelEvenement = await res.json();
      setEvenements(prev => [...prev, nouvelEvenement]);
      showToast(`✅ Événement "${form.titre}" créé avec succès !`);
      
      setForm(initForm);
      setCoverFile(null);
      setCoverPreview(null);
      setCategoriesTickets([{ nom: "Standard", prix: "", placesTotales: "" }]);
    } catch (error) {
      showToast("❌ " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const supprimerEvenement = async (id) => {
    if (!window.confirm("Supprimer cet événement et tous ses tickets associés ?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/evenements/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erreur suppression");
      setEvenements(prev => prev.filter(e => e.id !== id));
      showToast("🗑 Événement supprimé.", "error");
    } catch (error) {
      showToast("❌ " + error.message, "error");
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 3, marginBottom: 4 }} className="glow-text">ÉVÉNEMENTS</div>
          <div style={{ color: "var(--text2)", fontSize: 13 }}>{evenements.length} événement(s) programmé(s)</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
        
        <div className="glass-card" style={{ padding: "28px" }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 3, color: "var(--pink)", textTransform: "uppercase", marginBottom: 20 }}>
            🎪 Créer un nouvel événement
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Titre de l'événement *</label>
                <input style={inputStyle} placeholder="ex: ASTRONOTE Festival" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select style={inputStyle} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="concert">Concert</option>
                  <option value="festival">Festival</option>
                  <option value="soiree">Soirée</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input style={inputStyle} type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              </div>
              <div>
                <label style={labelStyle}>Heure</label>
                <input style={inputStyle} type="time" value={form.heure} onChange={e => setForm({...form, heure: e.target.value})} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Lieu *</label>
                <input style={inputStyle} placeholder="ex: Palais de la Culture" value={form.lieu} onChange={e => setForm({...form, lieu: e.target.value})} required />
              </div>
              <div>
                <label style={labelStyle}>Pays</label>
                <input style={inputStyle} placeholder="🇨🇮" value={form.pays} onChange={e => setForm({...form, pays: e.target.value})} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{...inputStyle, minHeight: 80, resize: "vertical"}} placeholder="Détails de l'événement..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Affiche de l'événement</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                <label style={{ flex: 1, minWidth: "200px", padding: "12px 14px", background: "rgba(236,72,153,0.08)", border: "1px dashed rgba(236,72,153,0.4)", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setCoverFile(file);
                    setCoverPreview(URL.createObjectURL(file));
                  }} />
                  <span style={{ fontSize: 20 }}>🖼️</span>
                  <span style={{ fontSize: 13, color: "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {coverFile ? coverFile.name : "Choisir une image..."}
                  </span>
                </label>
                {coverPreview && (
                  <img src={coverPreview} alt="Preview" style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
                )}
              </div>
            </div>

            <div style={{ marginTop: 24, padding: 20, background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <h4 style={{ margin: 0, color: "var(--accent2)", fontSize: 14, fontWeight: 700 }}>🎟 Catégories de tickets</h4>
                <button type="button" onClick={ajouterCategorie} style={{ padding: "8px 14px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  + Ajouter
                </button>
              </div>

              {categoriesTickets.map((cat, index) => (
                <div key={index} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 12, alignItems: "end" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{...labelStyle, fontSize: 10}}>Nom</label>
                    <input style={{...inputStyle, marginTop: 2, padding: "8px 10px"}} placeholder="VIP, Standard..." value={cat.nom} onChange={e => updateCategorie(index, "nom", e.target.value)} required />
                  </div>
                  <div>
                    <label style={{...labelStyle, fontSize: 10}}>Prix (FCFA)</label>
                    <input style={{...inputStyle, marginTop: 2, padding: "8px 10px"}} type="number" placeholder="5000" value={cat.prix} onChange={e => updateCategorie(index, "prix", e.target.value)} required />
                  </div>
                  <div>
                    <label style={{...labelStyle, fontSize: 10}}>Places</label>
                    <input style={{...inputStyle, marginTop: 2, padding: "8px 10px"}} type="number" placeholder="100" value={cat.placesTotales} onChange={e => updateCategorie(index, "placesTotales", e.target.value)} required />
                  </div>
                  <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                    <button 
                      type="button" 
                      onClick={() => supprimerCategorie(index)} 
                      disabled={categoriesTickets.length === 1} 
                      style={{ 
                        padding: "8px 16px", 
                        background: categoriesTickets.length === 1 ? "rgba(255,255,255,0.05)" : "rgba(236,72,153,0.1)", 
                        border: "1px solid rgba(236,72,153,0.3)", 
                        borderRadius: 8, 
                        color: categoriesTickets.length === 1 ? "var(--text2)" : "var(--pink)", 
                        cursor: categoriesTickets.length === 1 ? "not-allowed" : "pointer", 
                        fontSize: 12,
                        fontWeight: 600
                      }}
                    >
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: "linear-gradient(135deg, var(--accent), var(--cyan))", border: "none", borderRadius: 10, color: "#fff", cursor: loading ? "wait" : "pointer" }}>
              {loading ? "⏳ Création en cours..." : "🎪 Créer l'événement"}
            </button>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "calc(100vh - 140px)", overflowY: "auto", paddingRight: 8 }}>
          {evenements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed var(--border)" }}>
              🎪 Aucun événement programmé.
            </div>
          ) : (
            evenements.map(ev => {
              const nbCats = ev.categorieTickets ? ev.categorieTickets.length : 0;
              return (
                <div key={ev.id} className="glass-card admin-card-hover" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: ev.coverUrl ? "#1a1a2e" : "linear-gradient(135deg,rgba(236,72,153,0.2),rgba(124,58,237,0.2))", border: "1px solid rgba(236,72,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, overflow: "hidden" }}>
                    {ev.coverUrl ? (
                      <img src={ev.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      ev.coverEmoji || "🎪"
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Orbitron',sans-serif", letterSpacing: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>{ev.titre}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      📅 {new Date(ev.date).toLocaleDateString("fr-FR")} · 🎟 {nbCats} catégorie(s)
                    </div>
                  </div>
                  <button onClick={() => supprimerEvenement(ev.id)} style={{ padding: "8px 12px", background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: 8, color: "var(--pink)", fontSize: 12, cursor: "pointer", fontWeight: 600, flexShrink: 0, transition: "all 0.2s" }} title="Supprimer">
                    🗑
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default EvenementsAdmin;