import { Link } from "react-router-dom";
import Panel from "./hud/Panel";
import Badge from "./hud/Badge";
import PositionRow from "./PositionRow";
import { fmtUSD } from "../lib/format";

export default function ThemeCard({ theme, positions, quotes, catalystCount = 0 }) {
  const equityPositions = positions.filter(p => p.type === "equity");
  const optionPositions = positions.filter(p => p.type === "option");

  const totalValue = equityPositions.reduce((sum, p) => {
    const price = quotes[p.ticker]?.price;
    return sum + (price != null ? price * (p.shares || 0) : 0);
  }, 0);

  const isMock = Object.values(quotes).some(q => q?.mock);

  return (
    <Panel accent={theme.color} className="theme-card">
      <Link to={`/theme/${theme.id}`} className="theme-card-link">
        <header className="theme-card-header">
          <h2 className="theme-card-title" style={{ color: theme.color }}>
            {theme.name}
          </h2>
          <span className="theme-card-total">
            {totalValue > 0 ? fmtUSD(totalValue) : "—"}
          </span>
        </header>

        <p className="theme-card-thesis">{theme.thesis}</p>

        <div className="theme-card-positions">
          {positions.length === 0 ? (
            <span className="theme-card-empty">No positions</span>
          ) : (
            positions.map(p => (
              <PositionRow
                key={p.id || p.ticker}
                position={p}
                quote={quotes[p.ticker]}
              />
            ))
          )}
        </div>

        <footer className="theme-card-footer">
          <Badge variant="info" icon="◈">
            {positions.length} position{positions.length !== 1 ? "s" : ""}
          </Badge>
          {catalystCount > 0 && (
            <Badge variant="warn" icon="▣">
              {catalystCount} catalyst{catalystCount !== 1 ? "s" : ""}
            </Badge>
          )}
          {isMock && <Badge variant="muted">mock data</Badge>}
        </footer>
      </Link>
    </Panel>
  );
}
