import { usePortfolio } from "../hooks/usePortfolio";
import { useQuotes } from "../hooks/useQuotes";
import { useState, useEffect } from "react";
import ThemeCard from "../components/ThemeCard";
import ClusterBanner from "../components/ClusterBanner";
import { fmtDateTime } from "../lib/format";

export default function Home() {
  const { themes, positions, catalysts: seedCatalysts } = usePortfolio();
  const [catalysts, setCatalysts] = useState(seedCatalysts);
  const [catalystSource, setCatalystSource] = useState('seed');

  // Fetch live earnings dates from /api/catalysts on mount
  useEffect(() => {
    fetch('/api/catalysts')
      .then(r => r.json())
      .then(data => {
        if (data.catalysts?.length) {
          setCatalysts(data.catalysts);
          setCatalystSource(data.source || 'live');
        }
      })
      .catch(() => {}); // silently keep seed data on failure
  }, []);

  const tickers = [...new Set(positions.map(p => p.ticker))];
  const { quotes, loading } = useQuotes(tickers);

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

      <footer className="hud-footer">
        <span className="hud-footer-text">
          APEX · v2.0.0 · Phase 2B
          {catalystSource === 'finnhub' && ' · LIVE EARNINGS'}
        </span>
      </footer>
    </main>
  );
}
