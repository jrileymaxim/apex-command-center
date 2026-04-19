import { useParams, Link } from "react-router-dom";
import { usePortfolio } from "../hooks/usePortfolio";
import { useQuotes } from "../hooks/useQuotes";
import Panel from "../components/hud/Panel";
import Badge from "../components/hud/Badge";
import PositionRow from "../components/PositionRow";
import { fmtUSD, fmtDate } from "../lib/format";

export default function ThemeDetail() {
  const { id } = useParams();
  const { themes, positions, catalysts } = usePortfolio();
  const theme = themes.find(t => t.id === id);
  const themePositions = positions.filter(p => p.themeIds?.includes(id));
  const tickers = [...new Set(themePositions.map(p => p.ticker))];
  const { quotes } = useQuotes(tickers);

  if (!theme) {
    return (
      <main className="hud-layout">
        <Link to="/" className="hud-back">← HOME</Link>
        <Panel><p className="empty-state">Theme not found</p></Panel>
      </main>
    );
  }

  const totalValue = themePositions
    .filter(p => p.type === "equity")
    .reduce((sum, p) => {
      const price = quotes[p.ticker]?.price;
      return sum + (price != null ? price * (p.shares || 0) : 0);
    }, 0);

  const themeCatalysts = catalysts
    .filter(c => {
      const tickerSet = new Set(themePositions.map(p => p.ticker));
      return tickerSet.has(c.ticker) && new Date(c.date) >= new Date();
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <main className="hud-layout">
      <Link to="/" className="hud-back">← HOME</Link>

      <Panel accent={theme.color} className="theme-detail">
        <header className="theme-detail-header">
          <h1 style={{ color: theme.color }}>{theme.name}</h1>
          <div className="theme-detail-total">{fmtUSD(totalValue)}</div>
        </header>
        <p className="theme-detail-thesis">{theme.thesis}</p>

        <div className="theme-detail-section">
          <h3 className="section-heading">Positions</h3>
          <div className="position-list">
            {themePositions.map(p => (
              <PositionRow
                key={p.id || p.ticker}
                position={p}
                quote={quotes[p.ticker]}
              />
            ))}
          </div>
        </div>

        {themeCatalysts.length > 0 && (
          <div className="theme-detail-section">
            <h3 className="section-heading">Upcoming Catalysts</h3>
            <div className="catalyst-list">
              {themeCatalysts.map(c => (
                <div key={c.id} className="catalyst-item">
                  <span className="catalyst-date">{fmtDate(c.date)}</span>
                  <span className="catalyst-ticker">{c.ticker}</span>
                  <span className="catalyst-type">{c.type}</span>
                  {c.importance >= 4 && (
                    <Badge variant="warn">importance {c.importance}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </main>
  );
}
