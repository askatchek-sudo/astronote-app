import React, { useState, useEffect } from 'react';
import { albumsAPI, uploadAPI } from '../../lib/api'; // ✅ uploadAPI AJOUTÉ
import { GENRES } from '../../data/initialData';

export default function AlbumsAdmin({ albums: albumsProp, setAlbums: setAlbumsProp, artistes, showToast }) {
  const [albums, setAlbums] = useState(albumsProp || []);
  const [albForm, setAlbForm] = useState({
    titre: '', artisteId: '', annee: new Date().getFullYear(), genre: '', description: '', coverEmoji: '💿', 
    coverFile: null, coverPreview: null,
    isPayant: false, prix: '', dureeAcces: '0'
  });
  const [albEdit, setAlbEdit] = useState(null);

  useEffect(() => { chargerAlbums(); }, []);

  const chargerAlbums = async () => {
    try {
      const data = await albumsAPI.getAll();
      setAlbums(data);
      if (setAlbumsProp) setAlbumsProp(data);
    } catch (error) {
      console.error('Erreur chargement albums:', error);
    }
  };

  const sauvegarderAlbum = async () => {
    if (!albForm.titre || !albForm.artisteId) {
      showToast('Titre et artiste obligatoires.', 'error');
      return;
    }

    try {
      let coverUrl = null;
      
      // ✅ Upload via uploadAPI (gère automatiquement le token)
      if (albForm.coverFile) {
        showToast("⏳ Upload de l'image en cours...", "info");
        const uploadResult = await uploadAPI.image(albForm.coverFile);
        coverUrl = uploadResult.url;
        showToast("✅ Image uploadée !", "success");
      }

      const data = {
        titre: albForm.titre,
        artisteId: Number(albForm.artisteId),
        annee: Number(albForm.annee) || new Date().getFullYear(),
        genre: albForm.genre || null,
        description: albForm.description || null,
        coverUrl: coverUrl || null,
        coverEmoji: albForm.coverEmoji || '💿',
        isPayant: albForm.isPayant,
        prix: albForm.isPayant ? Number(albForm.prix) : null,
        dureeAcces: albForm.isPayant ? Number(albForm.dureeAcces) : null
      };

      if (albEdit) {
        const updated = await albumsAPI.update(albEdit, data);
        setAlbums(prev => prev.map(a => a.id === albEdit ? updated : a));
        showToast(`💿 "${albForm.titre}" mis à jour !`);
        setAlbEdit(null);
      } else {
        const nouveau = await albumsAPI.create(data);
        setAlbums(prev => [...prev, nouveau]);
        showToast(`💿 "${albForm.titre}" ajouté !`);
      }
      setAlbForm({ titre: '', artisteId: '', annee: new Date().getFullYear(), genre: '', description: '', coverEmoji: '💿', coverFile: null, coverPreview: null, isPayant: false, prix: '', dureeAcces: '0' });
    } catch (error) {
      showToast('Erreur: ' + error.message, 'error');
    }
  };

  const editerAlbum = (a) => {
    setAlbForm({
      titre: a.titre || '',
      artisteId: String(a.artisteId) || '',
      annee: a.annee || new Date().getFullYear(),
      genre: a.genre || '',
      description: a.description || '',
      coverEmoji: a.coverEmoji || '💿',
      coverFile: null,
      coverPreview: null,
      isPayant: a.isPayant || false,
      prix: a.prix || '',
      dureeAcces: a.dureeAcces ? String(a.dureeAcces) : '0'
    });
    setAlbEdit(a.id);
  };

  const supprimerAlbum = async (id) => {
    if (!confirm('Supprimer cet album ?')) return;
    try {
      await albumsAPI.delete(id);
      setAlbums(prev => prev.filter(a => a.id !== id));
      showToast('🗑 Album supprimé.', 'error');
    } catch (error) {
      showToast('Erreur: ' + error.message, 'error');
    }
  };

  const nomArtiste = (id) => artistes.find(a => a.id === Number(id))?.nom || '—';
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontFamily: "'Exo 2',sans-serif", fontSize: 14, outline: 'none', marginTop: 4, boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 3, marginBottom: 4 }} className="glow-text">ALBUMS</div>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>{albums.length} album(s) dans le catalogue</div>
        </div>
        {albEdit && <button className="btn-outline" onClick={() => { setAlbEdit(null); setAlbForm({ titre: '', artisteId: '', annee: new Date().getFullYear(), genre: '', description: '', coverEmoji: '💿', coverFile: null, coverPreview: null, isPayant: false, prix: '', dureeAcces: '0' }); }}>✕ Annuler</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 3, color: 'var(--accent2)', textTransform: 'uppercase', marginBottom: 20 }}>
            {albEdit ? '✏️ Modifier l\'album' : '💿 Ajouter un album'}
          </div>
          
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Titre *</label><input style={inputStyle} placeholder="Nom de l'album" value={albForm.titre} onChange={e => setAlbForm({ ...albForm, titre: e.target.value })} /></div>
          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Artiste *</label>
            <select style={inputStyle} value={albForm.artisteId} onChange={e => setAlbForm({ ...albForm, artisteId: e.target.value })}>
              <option value="">Choisir un artiste...</option>
              {artistes.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div><label style={labelStyle}>Année</label><input style={inputStyle} type="number" placeholder="2026" value={albForm.annee} onChange={e => setAlbForm({ ...albForm, annee: e.target.value })} /></div>
            <div><label style={labelStyle}>Emoji</label><input style={inputStyle} placeholder="💿" value={albForm.coverEmoji} onChange={e => setAlbForm({ ...albForm, coverEmoji: e.target.value })} /></div>
          </div>

          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Image de couverture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <label style={{ flex: 1, padding: '12px 14px', background: 'rgba(124,58,237,0.08)', border: '1px dashed rgba(124,58,237,0.4)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const file = e.target.files[0]; if (!file) return; setAlbForm(f => ({ ...f, coverFile: file, coverPreview: URL.createObjectURL(file) })); }} />
                <span style={{ fontSize: 20 }}>🖼️</span>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{albForm.coverFile ? albForm.coverFile.name : 'Choisir une image...'}</span>
              </label>
              {albForm.coverPreview && <img src={albForm.coverPreview} alt="Preview" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}><label style={labelStyle}>Genre</label>
            <select style={inputStyle} value={albForm.genre} onChange={e => setAlbForm({ ...albForm, genre: e.target.value })}>
              <option value="">Choisir...</option>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Description..." value={albForm.description} onChange={e => setAlbForm({ ...albForm, description: e.target.value })} /></div>

          <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--text2)", textTransform: "uppercase", marginBottom: 12, fontWeight: 700 }}>Accès à l'album</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button onClick={() => setAlbForm({ ...albForm, isPayant: false })} style={{ flex: 1, padding: "10px", border: `2px solid ${!albForm.isPayant ? "#00e676" : "var(--border)"}`, borderRadius: 8, background: !albForm.isPayant ? "rgba(0,230,118,0.12)" : "transparent", color: !albForm.isPayant ? "#00e676" : "var(--text2)", fontFamily: "'Exo 2',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🎧 Gratuit</button>
              <button onClick={() => setAlbForm({ ...albForm, isPayant: true })} style={{ flex: 1, padding: "10px", border: `2px solid ${albForm.isPayant ? "#f59e0b" : "var(--border)"}`, borderRadius: 8, background: albForm.isPayant ? "rgba(255,215,64,0.12)" : "transparent", color: albForm.isPayant ? "#f59e0b" : "var(--text2)", fontFamily: "'Exo 2',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🔒 Payant</button>
            </div>
            {albForm.isPayant && (
              <div style={{ display: "grid", gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                <div><label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "var(--text2)", textTransform: "uppercase", marginBottom: 6 }}>Prix (FCFA)</label><input style={inputStyle} type="number" placeholder="5000" value={albForm.prix} onChange={e => setAlbForm({ ...albForm, prix: e.target.value })} /></div>
                <div><label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "var(--text2)", textTransform: "uppercase", marginBottom: 6 }}>Durée d'accès</label>
                  <select style={inputStyle} value={albForm.dureeAcces} onChange={e => setAlbForm({ ...albForm, dureeAcces: e.target.value })}>
                    <option value="1">1 jour</option><option value="3">3 jours</option><option value="7">7 jours</option><option value="14">14 jours</option><option value="30">30 jours</option><option value="0">Illimité</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={sauvegarderAlbum} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: "14px", background: "linear-gradient(135deg, var(--accent), var(--cyan))", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer" }}>{albEdit ? '✏️ Enregistrer' : '💿 Ajouter l\'album'}</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {albums.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Aucun album.</div> : albums.map(a => (
            <div key={a.id} className="glass-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: a.coverUrl ? 'transparent' : 'linear-gradient(135deg,var(--accent),var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, overflow: 'hidden' }}>
                {a.coverUrl ? <img src={a.coverUrl} alt={a.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : a.coverEmoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Orbitron',sans-serif", letterSpacing: 1 }}>{a.titre}</div>
                <div style={{ fontSize: 12, color: 'var(--accent2)' }}>{nomArtiste(a.artisteId)}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                  {a.genre || '—'} · {a.annee} · {a.isPayant ? `🔒 ${a.prix} FCFA` : '🎧 Gratuit'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => editerAlbum(a)} style={{ padding: '6px 12px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 7, color: 'var(--accent2)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>✏️</button>
                <button onClick={() => supprimerAlbum(a.id)} style={{ padding: '6px 12px', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 7, color: 'var(--pink)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}