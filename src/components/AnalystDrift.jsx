import { useState, useEffect } from "react";
import { fmtUSD } from "../lib/format";

// Color helpers
const G = '#00ff88', R = '#ff3355', Y = '#fbbf24', DIM = '#444';
const updown = (v) => v >= 0 ? G : R;

function DriftBar({ price, low, mean, high, cost }) {
  const lo = Math.min(low, cost, price) * 0.90;
  const hi = Math.max(high, cost, price) * 1.05;
  const rng = hi - lo;
  const pct = (v) => Math.max(0, Math.min(100, ((v - lo) / rng) * 100));
  const markers = [
    { v: low,   col: R,   label: 'Low' },
    { v: mean,  col: Y,   label: 'Mean' },
    { v: high,  col: G,   label: 'High' },
    { v: price, col: '#60a5fa', label: 'Now' },
    { v: cost,  col: '#a78bfa', label: 'Cost' },
  ];
  return (
    <div style={{ position: 'relative', height: 28, marginBottom: 4 }}>
      {/* track */}
      <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
        {/* consensus range fill */}
        <div style={{ position: 'absolute', left: pct(low) + '%', width: (pct(high) - pct(low)) + '%', height: '100%', background: 'rgba(251,191,36,0.2)', borderRadius: 2 }} />
      </div>
      {/* markers */}
      {markers.map(m => (
        <div key={m.label} style={{
          position: 'absolute', top: 0, left: pct(m.v) + '%',
          transform: 'translateX(-50%)',
        }}>
          <div style={{ width: 2, height: m.label === 'Now' || m.label === 'Cost' ? 22 : 14, background: m.col, margin: '0 auto' }} />
          <div style={{ fontSize: 7, color: m.col, textAlign: 'center', whiteSpace: 'nowrap', marginTop: 1 }}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function AnalystDrift({ positions }) {
  const [targets, setTargets] = useState(null);
  const [source, setSource] = useState(null);

  useEffect(() => {
    fetch('/api/analysts')
      .then(r => r.json())
      .then(d => { setTargets(d.targets); setSource(d.source); })
      .catch(() => {});
  }, []);

  if (!targets) return null;

  // Only show positions that have analyst data
  const rows = positions
    .filter(p => targets[p.ticker] && p.price)
    .map(p => {
      const t = targets[p.ticker];
      const price = parseFloat(p.price) || p.avgCost;
      const upside = ((t.mean - price) / price) * 100;
      const vsLow = ((price - t.low) / t.low) * 100;
      return { ...p, ...t, price, upside, vsLow };
    })
    .sort((a, b) => b.upside - a.upside);

  if (!rows.length) return null;

  return (
    <section style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: Y, letterSpacing: 2, fontFamily: 'JetBrains Mono, monospace' }}>
          ANALYST DRIFT
        </div>
        <div style={{ fontSize: 8, color: DIM }}>{source === 'finnhub' ? 'LIVE · FINNHUB' : 'SEED DATA'}</div>
      </div>
      {rows.map(row => (
        <div key={row.ticker} style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 5, padding: '10px 12px', marginBottom: 6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', minWidth: 44, fontFamily: 'JetBrains Mono, monospace' }}>{row.ticker}</span>
              {row.rating && (
                <span style={{ fontSize: 8, padding: '2px 6px', background: row.rating === 'Buy' ? 'rgba(0,255,136,0.12)' : 'rgba(251,191,36,0.12)', color: row.rating === 'Buy' ? G : Y, border: '1px solid ' + (row.rating === 'Buy' ? G : Y) + '44', borderRadius: 3 }}>{row.rating.toUpperCase()}</span>
              )}
              {row.count && <span style={{ fontSize: 8, color: DIM }}>{row.count} analysts</span>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: updown(row.upside), fontFamily: 'JetBrains Mono, monospace' }}>
                {row.upside >= 0 ? '+' : ''}{row.upside.toFixed(1)}%
              </span>
              <div style={{ fontSize: 8, color: DIM }}>to consensus</div>
            </div>
          </div>
          <DriftBar price={row.price} low={row.low} mean={row.mean} high={row.high} cost={row.avgCost} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: DIM, marginTop: 4 }}>
            <span>Low {fmtUSD(row.low)}</span>
            <span style={{ color: Y }}>Mean {fmtUSD(row.mean)}</span>
            <span>High {fmtUSD(row.high)}</span>
          </div>
        </div>
      ))}
    </section>
  );
}