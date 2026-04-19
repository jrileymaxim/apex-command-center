import { usePortfolio } from "../hooks/usePortfolio";
import { useQuotes } from "../hooks/useQuotes";
import { useState, useEffect } from "react";
import ThemeCard from "../components/ThemeCard";
import ClusterBanner from "../components/ClusterBanner";
import AnalystDrift from "../components/AnalystDrift";
import { fmtDateTime } from "../lib/format";

export default function Home() {
  const { themes, positions, catalysts: seedCatalysts } = usePortfolio();
  const [catalysts, setCatalysts] = useState(seedCatalysts);
  const [catalystSource, setCatalystSource] = useState("seed");

  useEffect(() => {
    fetch("/api/catalysts")
      .then(r => r.json())
      .then(d => {
        if (d.catalysts?.length) {
          setCatalysts(d.catalysts);
          setCatalystSource(d.source || "live");
        }
      })
      .catch(() => {});
  }, []);

  const tickers = [...new Set(positions.map(p => p.ticker))];
  const { quotes, loading } = useQuotes(tickers);

  // Enrich positions with live quotes for AnalystDrift
  const enriched = positions.map(p => ({
    ...p,
    price: quotes[p.ticker]?.price ?? null,
  }));

  const catalystsByTheme = (themeId) => {
    const themeTickers = new Set(
      positions.filter(p => p.themeIds?.includes(themeId)).map(p => p.ticker)
    );
    return catalysts.filter(c => {
      const inFuture = new Date(c.date) >= new Date();
      return inFuture && themeTickers.has(c.ticker);
    }).length;
  };

  return (
    <main className="hud-layout">
      <header className="hud-header">
        <div className="hud-header-brand">
          <h1 className="hud-title">APEX</h1>
          <span className="hud-subtitle">COMMAND CENTER</span>
        </div>
        <div className="hud-header-status">
          <span className={`hud-status-dot ${loading ? "pulsing" : ""}`} />
          <span className="hud-header-time">{fmtDateTime(new Date())}</span>
        </div>
      </header>

      <ClusterBanner catalysts={catalysts} />

      <section className="theme-grid">
        {themes.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            positions={positions.filter(p => p.themeIds?.includes(theme.id))}
            quotes={quotes}
            catalystCount={catalystsByTheme(theme.id)}
            quotesLive={!loading && Object.values(quotes).some(q => !q.mock)}
          />
        ))}
      </section>

      <AnalystDrift positions={enriched.filter(p => p.type === "equity")} />

      <footer className="hud-footer">
        <span className="hud-footer-text">
          APEX · v2.0.0 · Phase 2C
          {catalystSource === "finnhub" && " · LIVE EARNINGS"}
        </span>
      </footer>
    </main>
  );
}