import { useState, useEffect, useRef } from "react";

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/uploads/")) return `http://localhost:3001${img}`;
  if (img.includes("/uploads/")) return `http://localhost:3001/${img.replace(/^\//, "")}`;
  return null;
};

const SearchBar = ({
  artistes,
  morceaux,
  albums,
  evenements,
  setPage,
  setArtisteSelectionne,
  setAlbumSelectionne,
  setMorceauEnCours
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // ─── Filtrage des résultats ────────────────────────────
  const q = query.trim().toLowerCase();

  const artistesFiltres = q
    ? artistes.filter(a =>
        a.nom.toLowerCase().includes(q) ||
        (a.genre && a.genre.toLowerCase().includes(q)) ||
        (a.pays && a.pays.toLowerCase().includes(q))
      ).slice(0, 5)
    : [];

  const morceauxFiltres = q
    ? morceaux.filter(m =>
        m.titre.toLowerCase().includes(q) ||
        (m.genre && m.genre.toLowerCase().includes(q))
      ).slice(0, 5)
    : [];

  const albumsFiltres = q
    ? albums.filter(a =>
        a.titre.toLowerCase().includes(q) ||
        (a.genre && a.genre.toLowerCase().includes(q))
      ).slice(0, 5)
    : [];

  const evenementsFiltres = q
    ? evenements.filter(e =>
        e.titre.toLowerCase().includes(q) ||
        (e.lieu && e.lieu.toLowerCase().includes(q)) ||
        (e.type && e.type.toLowerCase().includes(q))
      ).slice(0, 5)
    : [];

  const totalResults = artistesFiltres.length + morceauxFiltres.length + albumsFiltres.length + evenementsFiltres.length;
  const hasResults = totalResults > 0;

  // ─── Fermer le dropdown au clic extérieur ─────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Navigation au clavier ────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      // Trouver l'élément actif et cliquer dessus
      const allItems = [
        ...artistesFiltres.map(a => ({ type: "artiste", data: a })),
        ...morceauxFiltres.map(m => ({ type: "morceau", data: m })),
        ...albumsFiltres.map(a => ({ type: "album", data: a })),
        ...evenementsFiltres.map(ev => ({ type: "evenement", data: ev }))
      ];
      if (allItems[activeIndex]) {
        handleSelect(allItems[activeIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, totalResults - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    }
  };

  // ─── Gestion du clic sur un résultat ──────────────────
  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);

    switch (item.type) {
      case "artiste":
        setArtisteSelectionne(item.data.id);
        setPage("artiste-detail");
        window.scrollTo(0, 0);
        break;
      case "album":
        setAlbumSelectionne(item.data.id);
        setPage("album-detail");
        window.scrollTo(0, 0);
        break;
      case "morceau":
        const audioUrl = item.data.audioUrl?.startsWith("http")
          ? item.data.audioUrl
          : `http://localhost:3001${item.data.audioUrl}`;
        setMorceauEnCours({ ...item.data, audioUrl });
        break;
      case "evenement":
        setPage("accueil");
        window.scrollTo(0, 0);
        // Scroll vers la section événements après un petit délai
        setTimeout(() => {
          const eventsSection = document.querySelector('[data-section="events"]');
          if (eventsSection) eventsSection.scrollIntoView({ behavior: "smooth" });
        }, 100);
        break;
    }
  };

  // ─── Reset activeIndex quand la query change ──────────
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // ─── Raccourci clavier Ctrl+K pour focus ──────────────
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  // ─── Composants de résultat ───────────────────────────
  const ResultItem = ({ item, index, icon, color, subtitle, onClick }) => (
    <div
      onClick={onClick}
      onMouseEnter={() => setActiveIndex(index)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        cursor: "pointer",
        background: activeIndex === index ? "rgba(124,58,237,0.15)" : "transparent",
        borderRadius: 8,
        transition: "background 0.15s"
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: 13,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
        }}>
          {item.data.nom || item.data.titre}
        </div>
        {subtitle && (
          <div style={{
            fontSize: 11, color: "var(--text2)", marginTop: 2,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  let currentIndex = -1;

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", maxWidth: 400 }}>
      {/* Barre de recherche */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${isOpen ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 50,
        padding: "8px 16px",
        transition: "all 0.2s"
      }}>
        <span style={{ fontSize: 14, opacity: 0.6 }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text)",
            fontFamily: "'Exo 2',sans-serif",
            fontSize: 13,
            padding: 0
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text2)",
              cursor: "pointer",
              fontSize: 14,
              padding: 0,
              lineHeight: 1
            }}
          >
            ✕
          </button>
        )}
        <div style={{
          fontSize: 10,
          color: "var(--text2)",
          padding: "2px 6px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: 4,
          fontFamily: "'Space Mono',monospace",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          Ctrl+K
        </div>
      </div>

      {/* Dropdown des résultats */}
      {isOpen && q && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: 0,
          right: 0,
          background: "rgba(8,11,24,0.98)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          maxHeight: 500,
          overflowY: "auto",
          zIndex: 200,
          animation: "fadeUp 0.2s ease both"
        }}>
          {!hasResults ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--text2)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13 }}>Aucun résultat pour "{query}"</div>
            </div>
          ) : (
            <>
              {/* Artistes */}
              {artistesFiltres.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 10,
                    color: "var(--text2)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    padding: "4px 14px 8px",
                    fontWeight: 700
                  }}>
                    🎤 Artistes ({artistesFiltres.length})
                  </div>
                  {artistesFiltres.map(a => {
                    currentIndex++;
                    const idx = currentIndex;
                    const imgUrl = getImageUrl(a.img);
                    return (
                      <ResultItem
                        key={`artiste-${a.id}`}
                        item={{ type: "artiste", data: a }}
                        index={idx}
                        icon={imgUrl ? (
                          <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                        ) : (a.img || "🎵")}
                        color={imgUrl ? "#1a1a2e" : "linear-gradient(135deg,var(--accent),var(--cyan))"}
                        subtitle={`${a.genre || ""} ${a.pays ? `· ${a.pays}` : ""}`}
                        onClick={() => handleSelect({ type: "artiste", data: a })}
                      />
                    );
                  })}
                </div>
              )}

              {/* Morceaux */}
              {morceauxFiltres.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 10,
                    color: "var(--text2)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    padding: "4px 14px 8px",
                    fontWeight: 700
                  }}>
                    🎵 Morceaux ({morceauxFiltres.length})
                  </div>
                  {morceauxFiltres.map(m => {
                    currentIndex++;
                    const idx = currentIndex;
                    const artiste = artistes.find(a => a.id === Number(m.artisteId));
                    return (
                      <ResultItem
                        key={`morceau-${m.id}`}
                        item={{ type: "morceau", data: m }}
                        index={idx}
                        icon="🎵"
                        color="linear-gradient(135deg,var(--cyan),var(--accent))"
                        subtitle={`${artiste?.nom || "—"}${m.isPayant ? ` · 🔒 ${m.prix} FCFA` : " · 🎧 Gratuit"}`}
                        onClick={() => handleSelect({ type: "morceau", data: m })}
                      />
                    );
                  })}
                </div>
              )}

              {/* Albums */}
              {albumsFiltres.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 10,
                    color: "var(--text2)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    padding: "4px 14px 8px",
                    fontWeight: 700
                  }}>
                    💿 Albums ({albumsFiltres.length})
                  </div>
                  {albumsFiltres.map(a => {
                    currentIndex++;
                    const idx = currentIndex;
                    const coverUrl = getImageUrl(a.coverUrl);
                    const artiste = artistes.find(ar => ar.id === Number(a.artisteId));
                    return (
                      <ResultItem
                        key={`album-${a.id}`}
                        item={{ type: "album", data: a }}
                        index={idx}
                        icon={coverUrl ? (
                          <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
                        ) : (a.coverEmoji || "💿")}
                        color={coverUrl ? "#1a1a2e" : "linear-gradient(135deg,var(--pink),var(--accent))"}
                        subtitle={`${artiste?.nom || "—"}${a.annee ? ` · ${a.annee}` : ""}`}
                        onClick={() => handleSelect({ type: "album", data: a })}
                      />
                    );
                  })}
                </div>
              )}

              {/* Événements */}
              {evenementsFiltres.length > 0 && (
                <div>
                  <div style={{
                    fontSize: 10,
                    color: "var(--text2)",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    padding: "4px 14px 8px",
                    fontWeight: 700
                  }}>
                    🎪 Événements ({evenementsFiltres.length})
                  </div>
                  {evenementsFiltres.map(ev => {
                    currentIndex++;
                    const idx = currentIndex;
                    return (
                      <ResultItem
                        key={`event-${ev.id}`}
                        item={{ type: "evenement", data: ev }}
                        index={idx}
                        icon={ev.coverEmoji || "🎪"}
                        color="linear-gradient(135deg,var(--pink),var(--accent))"
                        subtitle={`${ev.lieu || ""} ${ev.pays ? `· ${ev.pays}` : ""}`}
                        onClick={() => handleSelect({ type: "evenement", data: ev })}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;