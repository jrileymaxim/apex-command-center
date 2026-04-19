import { usePortfolio } from "../hooks/usePortfolio";
import { useQuotes } from "../hooks/useQuotes";
import ThemeCard from "../components/ThemeCard";
import ClusterBanner from "../components/ClusterBanner";
import { fmtDateTime } from "../lib/format";

export default function Home() {
  const { themes, positions, catalysts } = usePortfolio();

  // Unique tickers across all holdings (including option underlyings for spot price)
  const tickers = [...new Set(positions.map(p => p.ticker))];
  const { quotes, loading } = useQuotes(tickers);

  const catalystsByTheme = (themeId) => {
    const themeTickers = new Set(
      positions
        .filter(p => p.themeIds?.includes(themeId))
        .map(p => p.ticker)
    );
    return catalysts.filter(c => {
      const inFuture = new Date(c.date) >= new Date();
      const matchesTheme = themeTickers.has(c.ticker);
      return inFuture && matchesTheme;
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
          />
        ))}
      </section>

      <footer className="hud-footer">
        <span className="hud-footer-text">APEX · v2.0.0 · Phase 2A</span>
      </footer>
    </main>
  );
}
