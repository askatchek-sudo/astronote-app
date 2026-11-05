import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const COLORS = ['#7c3aed', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // ✅ 1. Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      // ✅ 2. L'envoyer dans les headers de la requête
      const res = await fetch("http://localhost:3001/api/admin/analytics", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`Accès refusé ou erreur serveur (${res.status})`);
      }
      
      const result = await res.json();
      
      // ✅ 3. Vérification de sécurité pour s'assurer que les données sont bien au format attendu
      if (!result || !result.kpis) {
        throw new Error("Format de données invalide");
      }
      
      setData(result);
    } catch (error) {
      console.error("Erreur chargement analytics:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>Chargement des données...</div>;
  
  // ✅ 4. Affichage propre de l'erreur au lieu d'un écran noir
  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--pink)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3>Erreur de chargement</h3>
        <p>{error}</p>
        <button onClick={fetchAnalytics} className="btn-primary" style={{ marginTop: 16 }}>Réessayer</button>
      </div>
    );
  }
  
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>Aucune donnée disponible.</div>;

  const formatFCFA = (value) => `${(value || 0).toLocaleString()} FCFA`;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 3, marginBottom: 8 }} className="glow-text">
        ANALYTICS & KPI
      </div>
      <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 32 }}>
        Vue d'ensemble en temps réel de la plateforme ASTRONOTE
      </div>

      {/* ─── KPI CARDS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
        {[
          { label: "Chiffre d'Affaires", value: formatFCFA(data.kpis.caTotal), icon: "💰", color: "var(--gold)" },
          { label: "Fans Inscrits", value: data.kpis.totalUsers || 0, icon: "👥", color: "var(--cyan)" },
          { label: "Morceaux Publiés", value: data.kpis.totalMorceaux || 0, icon: "🎵", color: "var(--accent2)" },
          { label: "Événements", value: data.kpis.totalEvenements || 0, icon: "🎪", color: "var(--pink)" },
        ].map((kpi, i) => (
          <div key={i} className="glass-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 }}>{kpi.label}</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, color: kpi.color, marginTop: 4 }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── GRAPHIQUES ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20, marginBottom: 32 }}>
        
        {/* Graphique CA */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, marginBottom: 20, color: "var(--text)" }}>
            📈 Évolution du CA (7 derniers jours)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.dataVentes || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="jour" stroke="var(--text2)" fontSize={12} />
              <YAxis stroke="var(--text2)" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip 
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
                formatter={(value) => formatFCFA(value)}
              />
              <Line type="monotone" dataKey="CA" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5, fill: "#06b6d4" }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique Artistes */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, marginBottom: 20, color: "var(--text)" }}>
            🏆 Top Artistes (par catalogue)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.dataArtistes || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
              <XAxis type="number" stroke="var(--text2)" fontSize={12} />
              <YAxis dataKey="nom" type="category" stroke="var(--text2)" fontSize={12} width={80} />
              <Tooltip 
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
                formatter={(value) => `${value} morceaux`}
              />
              <Bar dataKey="morceaux" radius={[0, 10, 10, 0]}>
                {(data.dataArtistes || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── TAUX DE REMPLISSAGE ÉVÉNEMENTS ─── */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, marginBottom: 20, color: "var(--text)" }}>
          🎟 Taux de remplissage des événements
        </h3>
        {(!data.dataEvenements || data.dataEvenements.length === 0) ? (
          <div style={{ textAlign: "center", padding: 20, color: "var(--text2)" }}>Aucun événement programmé.</div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {data.dataEvenements.map(ev => (
              <div key={ev.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{ev.titre} <span style={{ color: "var(--text2)", fontWeight: 400 }}>({ev.date})</span></span>
                  <span style={{ color: ev.taux >= 80 ? "var(--gold)" : "var(--cyan)", fontWeight: 700 }}>
                    {ev.vendues} / {ev.total} places ({ev.taux}%)
                  </span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ 
                    width: `${ev.taux}%`, 
                    height: "100%", 
                    background: ev.taux >= 80 ? "linear-gradient(90deg, var(--gold), #fbbf24)" : "linear-gradient(90deg, var(--cyan), var(--accent))",
                    transition: "width 1s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;