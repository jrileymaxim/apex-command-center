import Ticker from "./hud/Ticker";
import { fmtUSD, fmtShares } from "../lib/format";

export default function PositionRow({ position, quote }) {
  const price = quote?.price;
  const isOption = position.type === "option";

  // For options, "shares" are actually contracts and price math differs.
  // Phase 2A: display option positions simply with ticker + strike info.
  if (isOption) {
    const legs = position.legs || [];
    return (
      <div className="position-row position-row-option">
        <span className="position-ticker">{position.ticker}</span>
        <span className="position-meta">
          {legs.length} leg{legs.length !== 1 ? "s" : ""} · ${legs[0]?.strike}C
        </span>
        <span className="position-underlying">
          {price != null ? <Ticker value={price} formatter={fmtUSD} /> : "—"}
        </span>
      </div>
    );
  }

  const shares = position.shares || 0;
  const value = price != null ? price * shares : null;

  return (
    <div className="position-row">
      <span className="position-ticker">{position.ticker}</span>
      <span className="position-shares">{fmtShares(shares)}</span>
      <span className="position-price">
        {price != null ? <Ticker value={price} formatter={fmtUSD} /> : "—"}
      </span>
      <span className="position-value">
        {value != null ? fmtUSD(value) : "—"}
      </span>
    </div>
  );
}
