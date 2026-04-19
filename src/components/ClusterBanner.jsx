import Panel from "./hud/Panel";
import { fmtDate, daysBetween } from "../lib/format";

const CLUSTER_MIN_EVENTS = 3;
const CLUSTER_WINDOW_DAYS = 30;

/**
 * Detects a "catalyst cluster" — 3+ upcoming events inside a rolling window.
 * Phase 2A uses seeded events; Phase 2B will wire live Finnhub data.
 */
export default function ClusterBanner({ catalysts = [] }) {
  const now = new Date();
  const upcoming = catalysts
    .filter(c => new Date(c.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (upcoming.length < CLUSTER_MIN_EVENTS) return null;

  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + CLUSTER_WINDOW_DAYS);
  const inWindow = upcoming.filter(c => new Date(c.date) <= windowEnd);

  if (inWindow.length < CLUSTER_MIN_EVENTS) return null;

  const span = daysBetween(
    inWindow[0].date,
    inWindow[inWindow.length - 1].date
  );

  const hasHighImportance = inWindow.some(c => c.importance >= 5);

  return (
    <Panel accent="var(--accent-amber)" className="cluster-banner">
      <div className="cluster-banner-head">
        <span className="cluster-icon" aria-hidden="true">⚠</span>
        <div>
          <strong className="cluster-title">CATALYST CLUSTER</strong>
          <span className="cluster-sub">
            {inWindow.length} prints in {span} days
            {hasHighImportance && " · options exposure active"}
          </span>
        </div>
      </div>
      <div className="cluster-events">
        {inWindow.map(event => (
          <div key={event.id} className="cluster-event">
            <span className="cluster-event-date">{fmtDate(event.date)}</span>
            <span className="cluster-event-ticker">{event.ticker}</span>
            {event.importance >= 5 && (
              <span className="cluster-event-pulse" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
