import React, { useState } from 'react';
import { messagesAPI } from '../lib/api';

export default function ContactForm() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      await messagesAPI.envoyer(form.nom, form.email, form.sujet, form.message);
      setStatus('success');
      setForm({ nom: '', email: '', sujet: '', message: '' });
      setTimeout(() => setStatus(null), 5000);
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: '#fff',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: 14,
    outline: 'none',
    marginTop: 4,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  };

  return (
    <form onSubmit={handleSubmit}>
      {status === 'success' && (
        <div style={{
          background: 'rgba(0,230,118,0.1)',
          border: '1px solid rgba(0,230,118,0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          color: '#00e676',
          fontSize: 13,
          marginBottom: 16,
          textAlign: 'center',
        }}>
          ✅ Message envoyé avec succès !
        </div>
      )}

      {status === 'error' && (
        <div style={{
          background: 'rgba(236,72,153,0.1)',
          border: '1px solid rgba(236,72,153,0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          color: '#ec4899',
          fontSize: 13,
          marginBottom: 16,
          textAlign: 'center',
        }}>
          ⚠ Erreur lors de l'envoi. Veuillez réessayer.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Nom *</label>
          <input
            style={inputStyle}
            placeholder="Votre nom"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Email *</label>
          <input
            style={inputStyle}
            type="email"
            placeholder="votre@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Sujet</label>
        <input
          style={inputStyle}
          placeholder="Objet de votre message"
          value={form.sujet}
          onChange={(e) => setForm({ ...form, sujet: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Message *</label>
        <textarea
          style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
          placeholder="Votre message..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          border: 'none',
          borderRadius: 10,
          color: '#fff',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 2,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '⏳ ENVOI...' : '✦ ENVOYER LE MESSAGE'}
      </button>
    </form>
  );
}