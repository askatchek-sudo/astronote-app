import React, { useState, useEffect } from 'react';
import { messagesAPI } from '../../lib/api';

export default function MessagesAdmin() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    chargerMessages();
  }, []);

  const chargerMessages = async () => {
    try {
      const data = await messagesAPI.getAll();
      setMessages(data);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECTION : Utilisation de markAsRead au lieu de marquerLu
  const marquerLu = async (id) => {
    try {
      await messagesAPI.markAsRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, lu: true } : m));
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  // ✅ CORRECTION : Utilisation de delete au lieu de supprimer
  const supprimer = async (id) => {
    if (!confirm('Supprimer ce message définitivement ?')) return;
    try {
      await messagesAPI.delete(id);
      // Mise à jour immédiate de l'interface
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert("❌ Erreur lors de la suppression : " + (error.message || "Inconnue"));
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const messagesNonLus = messages.filter(m => !m.lu).length;

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 3,
            marginBottom: 4,
          }} className="glow-text">
            MESSAGES REÇUS
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>
            {messages.length} message(s) · {messagesNonLus} non lu(s)
          </div>
        </div>
        <button onClick={chargerMessages} style={{
          padding: '10px 16px',
          background: 'rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.3)',
          borderRadius: 8,
          color: 'var(--cyan)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
        }}>
          🔄 Actualiser
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
        {/* Liste des messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 600, overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: 'var(--text2)',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 12,
            }}>
              Aucun message reçu pour le moment.
            </div>
          ) : (
            messages.map(m => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedMessage(m);
                  if (!m.lu) marquerLu(m.id);
                }}
                style={{
                  padding: '14px 16px',
                  background: selectedMessage?.id === m.id
                    ? 'rgba(124,58,237,0.15)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${!m.lu ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {!m.lu && <span style={{ color: 'var(--cyan)', marginRight: 6 }}>●</span>}
                    {m.nom}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{formatDate(m.createdAt)}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{m.email}</div>
                {m.sujet && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent2)' }}>{m.sujet}</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Détail du message */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 24,
          minHeight: 400,
        }}>
          {selectedMessage ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                    De
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedMessage.nom}</div>
                  <div style={{ fontSize: 13, color: 'var(--cyan)' }}>{selectedMessage.email}</div>
                </div>
                <button
                  onClick={() => supprimer(selectedMessage.id)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(236,72,153,0.1)',
                    border: '1px solid rgba(236,72,153,0.2)',
                    borderRadius: 7,
                    color: 'var(--pink)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  🗑 Supprimer
                </button>
              </div>

              {selectedMessage.sujet && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 14,
                  fontWeight: 600,
                }}>
                  📌 {selectedMessage.sujet}
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                Message
              </div>
              <div style={{
                padding: 16,
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {selectedMessage.message}
              </div>

              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text2)' }}>
                Reçu le {formatDate(selectedMessage.createdAt)}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: 'var(--text2)',
              fontSize: 14,
            }}>
              📭 Sélectionnez un message pour le lire
            </div>
          )}
        </div>
      </div>
    </div>
  );
}