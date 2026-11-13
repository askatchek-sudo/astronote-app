import React, { useState, useEffect } from 'react';
import { uploadAPI } from '../../lib/api'; // ✅ AJOUT DE uploadAPI

// ✅ AJOUT : Variable d'environnement pour la production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ✅ Fonction robuste pour gérer TOUS les formats d'URL d'image
const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  // ✅ CORRECTION : Utilise API_URL au lieu de localhost en dur
  if (img.startsWith('/uploads/')) return `${API_URL}${img}`;
  if (img.includes('/uploads/')) return `${API_URL}/${img.replace(/^\//, '')}`;
  return `${API_URL}/uploads/${img}`;
};

export default function ActualitesAdmin({ showToast }) {
  const [actualites, setActualites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ titre: '', description: '', imageUrl: '', lien: '', ordre: 0, actif: true });
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    chargerActualites();
  }, []);

  const chargerActualites = async () => {
    try {
      const token = localStorage.getItem('token');
      // ✅ CORRECTION : Utilise API_URL
      const res = await fetch(`${API_URL}/api/actualites/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setActualites(data);
    } catch (error) {
      console.error('Erreur chargement actualités:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre) {
      showToast("Le titre est obligatoire", "error");
      return;
    }

    try {
      let finalImageUrl = form.imageUrl;

      // ✅ Upload de l'image via uploadAPI (gère automatiquement le token)
      if (imageFile) {
        showToast("⏳ Upload de l'image en cours...", "info");
        const uploadData = await uploadAPI.image(imageFile);
        finalImageUrl = uploadData.url;
        showToast("✅ Image uploadée !", "success");
      }

      const payload = { ...form, imageUrl: finalImageUrl };
      const token = localStorage.getItem('token');

      if (editId) {
        // ✅ CORRECTION : Utilise API_URL
        const res = await fetch(`${API_URL}/api/actualites/${editId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) showToast("✅ Actualité modifiée !", "success");
      } else {
        // ✅ CORRECTION : Utilise API_URL
        const res = await fetch(`${API_URL}/api/actualites`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) showToast("✅ Actualité créée !", "success");
      }

      setForm({ titre: '', description: '', imageUrl: '', lien: '', ordre: 0, actif: true });
      setImageFile(null);
      setImagePreview(null);
      setEditId(null);
      chargerActualites();
    } catch (error) {
      showToast("❌ Erreur: " + error.message, "error");
    }
  };

  const editerActualite = (act) => {
    setForm({
      titre: act.titre,
      description: act.description || '',
      imageUrl: act.imageUrl || '',
      lien: act.lien || '',
      ordre: act.ordre,
      actif: act.actif
    });
    setEditId(act.id);
    if (act.imageUrl) {
      setImagePreview(getImageUrl(act.imageUrl));
    } else {
      setImagePreview(null);
    }
  };

  const supprimerActualite = async (id) => {
    if (!window.confirm("Supprimer cette actualité ?")) return;
    try {
      const token = localStorage.getItem('token');
      // ✅ CORRECTION : Utilise API_URL
      const res = await fetch(`${API_URL}/api/actualites/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("🗑 Actualité supprimée", "success");
        chargerActualites();
      }
    } catch (error) {
      showToast("❌ Erreur: " + error.message, "error");
    }
  };

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontFamily: "'Exo 2',sans-serif",
    fontSize: 14, outline: 'none', marginTop: 4, boxSizing: 'border-box'
  };

  const labelStyle = { display: 'block', fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Chargement...</div>;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 3, marginBottom: 4 }} className="glow-text">
            ACTUALITÉS & DIAPORAMA
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>
            Gérez les éléments du diaporama de la page d'accueil
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 3, color: 'var(--accent2)', textTransform: 'uppercase', marginBottom: 20 }}>
            {editId ? '✏️ Modifier l\'actualité' : '➕ Nouvelle actualité'}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Titre *</label>
              <input style={inputStyle} placeholder="Titre de l'actualité" value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} required />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{...inputStyle, minHeight: 80, resize: 'vertical'}} placeholder="Description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Image</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <label style={{ flex: 1, padding: '12px 14px', background: 'rgba(124,58,237,0.08)', border: '1px dashed rgba(124,58,237,0.4)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }} />
                  <span style={{ fontSize: 20 }}>🖼️</span>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{imageFile ? imageFile.name : 'Choisir une image...'}</span>
                </label>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                )}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Lien (optionnel)</label>
              <input style={inputStyle} placeholder="https://..." value={form.lien} onChange={e => setForm({...form, lien: e.target.value})} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Ordre d'affichage</label>
                <input style={inputStyle} type="number" placeholder="0" value={form.ordre} onChange={e => setForm({...form, ordre: Number(e.target.value)})} />
              </div>
              <div>
                <label style={labelStyle}>Statut</label>
                <select style={inputStyle} value={form.actif} onChange={e => setForm({...form, actif: e.target.value === 'true'})}>
                  <option value="true">✅ Actif</option>
                  <option value="false">❌ Inactif</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {editId ? '✏️ Enregistrer les modifications' : '➕ Créer l\'actualité'}
            </button>

            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm({ titre: '', description: '', imageUrl: '', lien: '', ordre: 0, actif: true }); setImageFile(null); setImagePreview(null); }} style={{ width: '100%', marginTop: 12, padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text2)', cursor: 'pointer' }}>
                ✕ Annuler l'édition
              </button>
            )}
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {actualites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Aucune actualité créée</div>
          ) : (
            actualites.map(act => {
              const imgUrl = getImageUrl(act.imageUrl);
              return (
                <div key={act.id} className="glass-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: act.actif ? 1 : 0.5 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 10, background: imgUrl ? '#1a1a2e' : 'linear-gradient(135deg,var(--accent),var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, overflow: 'hidden' }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={act.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          console.warn(`⚠️ Échec chargement image admin: ${imgUrl}`);
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '📰';
                        }}
                      />
                    ) : '📰'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Orbitron',sans-serif", marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.titre}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>Ordre: {act.ordre} · {act.actif ? '✅ Actif' : '❌ Inactif'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => editerActualite(act)} style={{ padding: '6px 12px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 7, color: 'var(--accent2)', fontSize: 12, cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => supprimerActualite(act.id)} style={{ padding: '6px 12px', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 7, color: 'var(--pink)', fontSize: 12, cursor: 'pointer' }}>🗑</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}