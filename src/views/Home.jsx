import { usePortfolio } from "../hooks/usePortfolio";
import { useQuotes } from "../hooks/useQuotes";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import ClusterBanner from "../components/ClusterBanner";
import { fmtUSD, fmtDateTime } from "../lib/format";

// ── Theme config ─────────────────────────────────────────────────────────────
const THEME_META = {
  'water-infra': { label:'Water',      color:'#2AFF8F' },
  'ai-infra':    { label:'AI Infra',   color:'#FF9F2A' },
  'macro':       { label:'Macro',      color:'#FFD700' },
  'speculative': { label:'Spec',       color:'#FF4A6E' },
  'aviation':    { label:'Aviation',   color:'#60A5FA' },
  'options':     { label:'Options',    color:'#B84AFF' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const G = '#2AFF8F', R = '#FF4A6E', Y = '#FFD700', DIM = 'rgba(255,255,255,0.35)';
const col = v => v > 0 ? G : v < 0 ? R : DIM;
const pct = v => (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
const usd = v => (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2);
const REFRESH_MS = 60_000;

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, valueColor, sub }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'12px 14px' }}>
      <div style={{ fontSize:10, color:DIM, letterSpacing:2, marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color: valueColor || '#fff', fontFamily:'JetBrains Mono,monospace', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:DIM, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// ── SOUN LEAPS mini-panel ────────────────────────────────────────────────────
function LeapsMini({ spot }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/options').then(r=>r.json()).then(setData).catch(()=>{});
  }, []);
  if (!data) return null;
  const { combined, leaps } = data;
  const liveSpot = spot || data.spot;
  return (
    <div style={{ background:'rgba(184,74,255,0.06)', border:'1px solid rgba(184,74,255,0.25)', borderRadius:8, padding:'12px 16px', marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:10, color:'#B84AFF', letterSpacing:2, marginBottom:2 }}>SOUN LEAPS</div>
          <div style={{ fontSize:11, color:DIM }}>2 contracts · $10C · SOUN @ ${liveSpot?.toFixed(2) || data.spot.toFixed(2)}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:20, fontWeight:700, color:combined.totalPnl>=0?G:R, fontFamily:'JetBrains Mono,monospace' }}>
            {combined.totalPnl>=0?'+':''}${Math.abs(combined.totalPnl).toFixed(0)}
          </div>
          <div style={{ fontSize:11, color:combined.totalPnl>=0?G:R }}>
            {((combined.totalPnl/combined.totalCost)*100).toFixed(1)}% return
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        {leaps.map((l,i) => {
          const bePct = Math.min(100,(liveSpot||data.spot)/l.breakeven*100);
          return (
            <div key={i} style={{ background:'rgba(0,0,0,0.2)', borderRadius:6, padding:'8px 10px' }}>
              <div style={{ fontSize:10, color:'#B84AFF', marginBottom:4 }}>{l.expiry.slice(2).replace(/-/g,'/')}</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:6 }}>
                <span style={{ color:DIM }}>Δ {l.delta.toFixed(3)}</span>
                <span style={{ color:DIM }}>Θ ${Math.abs(l.dailyTheta).toFixed(2)}/d</span>
                <span style={{ color:l.pnl>=0?G:R }}>{l.pnl>=0?'+':''}${Math.abs(l.pnl).toFixed(0)}</span>
              </div>
              <div style={{ height:3, background:'rgba(255,255,255,0.08)', borderRadius:2 }}>
                <div style={{ height:'100%', width:bePct+'%', background:'#B84AFF', borderRadius:2 }} />
              </div>
              <div style={{ fontSize:9, color:DIM, marginTop:2, textAlign:'right' }}>BE ${l.breakeven} · {bePct.toFixed(0)}%</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:16, fontSize:10, color:DIM }}>
          <span>Σ Δ {combined.combinedDelta.toFixed(3)}</span>
          <span>Θ ${Math.abs(combined.dailyThetaTotal).toFixed(2)}/day</span>
          <span>Σ Γ {combined.combinedGamma.toFixed(4)}</span>
        </div>
        <Link to="/theme/options" style={{ fontSize:10, color:'#B84AFF', textDecoration:'none', letterSpacing:1 }}>FULL GREEKS →</Link>
      </div>
    </div>
  );
}

// ── Position row ─────────────────────────────────────────────────────────────
function PosRow({ pos, quote, analyst, isAlert }) {
  const price = quote?.price ?? null;
  const mock = quote?.mock !== false;
  const cost = pos.avgCost || 0;
  const mktVal = price ? price * pos.shares : cost * pos.shares;
  const costVal = cost * pos.shares;
  const gainAmt = mktVal - costVal;
  const gainPct = costVal > 0 ? (gainAmt / costVal) * 100 : 0;
  const dayPct = quote?.chgPct ?? null;
  const theme = THEME_META[pos.themeIds?.[0]] || { label:'—', color:'#888' };
  const upside = analyst?.mean && price ? ((analyst.mean - price) / price * 100) : null;

  return (
    <div style={{
      display:'grid', gridTemplateColumns:'44px 1fr 70px 70px 60px 80px 60px',
      gap:8, alignItems:'center', padding:'8px 12px',
      background: isAlert ? 'rgba(255,215,0,0.04)' : 'transparent',
      borderBottom:'1px solid rgba(255,255,255,0.05)',
      borderLeft: isAlert ? '2px solid ' + Y : '2px solid transparent',
    }}>
      <span style={{ fontSize:13, fontWeight:700, color:'#fff', fontFamily:'JetBrains Mono,monospace', letterSpacing:1 }}>{pos.ticker}</span>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:9, padding:'2px 5px', background:theme.color+'22', color:theme.color, borderRadius:3, whiteSpace:'nowrap' }}>{theme.label}</span>
        <span style={{ fontSize:10, color:DIM }}>{pos.shares} sh</span>
      </div>
      <span style={{ fontSize:11, color:DIM, textAlign:'right' }}>{price ? '$'+price.toFixed(2) : '—'}{mock ? ' ·' : ''}</span>
      <span style={{ fontSize:11, color:col(dayPct||0), textAlign:'right', fontFamily:'JetBrains Mono,monospace' }}>{dayPct !== null ? pct(dayPct) : '—'}</span>
      <span style={{ fontSize:11, color:col(gainAmt), textAlign:'right', fontFamily:'JetBrains Mono,monospace' }}>{price ? usd(gainAmt) : '—'}</span>
      <div style={{ textAlign:'right' }}>
        <span style={{ fontSize:11, color:col(gainPct), fontFamily:'JetBrains Mono,monospace' }}>{price ? pct(gainPct) : '—'}</span>
        {upside !== null && <div style={{ fontSize:9, color:upside>0?G:R }}>{upside>0?'+':''}{upside.toFixed(0)}% to tgt</div>}
      </div>
      <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
        <div style={{ height:'100%', width:Math.min(100,Math.abs(gainPct)*3)+'%', background:gainPct>=0?G:R, borderRadius:2, opacity:0.7 }} />
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { themes, positions, catalysts: seedCatalysts } = usePortfolio();
  const [catalysts, setCatalysts] = useState(seedCatalysts);
  const [analysts, setAnalysts] = useState({});
  const [now, setNow] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(null);

  const equityPositions = positions.filter(p => p.type === 'equity');
  const tickers = [...new Set(equityPositions.map(p => p.ticker))];
  const { quotes, loading, refresh } = useQuotes(tickers);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh prices every 60s
  useEffect(() => {
    const t = setInterval(() => { refresh?.(); setLastRefresh(new Date()); }, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  // Fetch catalysts + analyst targets
  useEffect(() => {
    fetch('/api/catalysts').then(r=>r.json()).then(d=>{ if(d.catalysts?.length) setCatalysts(d.catalysts); }).catch(()=>{});
    fetch('/api/analysts').then(r=>r.json()).then(d=>{ if(d.targets) setAnalysts(d.targets); }).catch(()=>{});
  }, []);

  // Portfolio metrics
  const enriched = equityPositions.map(p => {
    const q = quotes[p.ticker] || {};
    const price = q.price ?? null;
    const cost = (p.avgCost||0) * p.shares;
    const mkt = price ? price * p.shares : cost;
    const gain = mkt - cost;
    const gainPct = cost > 0 ? (gain/cost)*100 : 0;
    const dayPct = q.chgPct ?? null;
    const isAlert = dayPct !== null && Math.abs(dayPct) >= 3;
    return { ...p, price, cost, mkt, gain, gainPct, dayPct, isAlert };
  });

  const totalCost = enriched.reduce((a,p)=>a+p.cost, 0);
  const totalMkt  = enriched.reduce((a,p)=>a+p.mkt, 0);
  const totalGain = totalMkt - totalCost;
  const totalPct  = totalCost > 0 ? (totalGain/totalCost)*100 : 0;
  const dayGain   = enriched.filter(p=>p.dayPct!==null).reduce((a,p)=>a+(p.mkt - p.mkt/(1+p.dayPct/100)),0);
  const alerts    = enriched.filter(p=>p.isAlert).length;
  const sounSpot  = quotes['SOUN']?.price ?? null;

  // Group by theme, sort within theme by |dayPct| desc (movers first)
  const THEME_ORDER = ['water-infra','ai-infra','macro','speculative','aviation'];
  const grouped = THEME_ORDER.map(tid => ({
    id: tid,
    meta: THEME_META[tid],
    positions: enriched.filter(p=>p.themeIds?.includes(tid)).sort((a,b)=>Math.abs(b.dayPct||0)-Math.abs(a.dayPct||0)),
  })).filter(g=>g.positions.length>0);

  const pad2 = n => String(n).padStart(2,'0');
  const timeStr = pad2(now.getHours())+':'+pad2(now.getMinutes())+':'+pad2(now.getSeconds());

  return (
    <main style={{ minHeight:'100vh', background:'#080810', color:'#fff', fontFamily:'JetBrains Mono, monospace', padding:'0 0 40px' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.4)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background: loading ? Y : G, boxShadow:'0 0 8px '+(loading?Y:G) }} />
          <span style={{ fontSize:13, fontWeight:700, letterSpacing:4, color:'#fff' }}>APEX</span>
          <span style={{ fontSize:10, color:DIM, letterSpacing:2 }}>COMMAND CENTER</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {alerts > 0 && <span style={{ fontSize:10, color:Y, padding:'2px 8px', border:'1px solid '+Y+'44', borderRadius:4 }}>⚡ {alerts} MOVERS</span>}
          {lastRefresh && <span style={{ fontSize:9, color:DIM }}>↻ {pad2(lastRefresh.getHours())}:{pad2(lastRefresh.getMinutes())}</span>}
          <span style={{ fontSize:14, fontWeight:700, color:'#fff', fontFamily:'JetBrains Mono,monospace' }}>{timeStr}</span>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'16px 20px' }}>

        {/* Catalyst banner */}
        <ClusterBanner catalysts={catalysts} />

        {/* Portfolio summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, margin:'14px 0' }}>
          <StatCard label="PORTFOLIO VALUE" value={'$'+totalMkt.toFixed(2)} />
          <StatCard label="DAY P&L" value={usd(dayGain)} valueColor={col(dayGain)} sub={loading?'loading…':'live prices'} />
          <StatCard label="TOTAL RETURN" value={usd(totalGain)} valueColor={col(totalGain)} />
          <StatCard label="RETURN %" value={(totalPct>=0?'+':'')+totalPct.toFixed(2)+'%'} valueColor={col(totalPct)} sub={enriched.length+' positions'} />
        </div>

        {/* SOUN LEAPS — always visible */}
        <LeapsMini spot={sounSpot} />

        {/* Positions — column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 70px 70px 60px 80px 60px', gap:8, padding:'6px 12px', marginBottom:4 }}>
          {['TICKER','THEME / SHARES','PRICE','DAY','P&L','RETURN',''].map(h=>(
            <span key={h} style={{ fontSize:9, color:DIM, letterSpacing:1 }}>{h}</span>
          ))}
        </div>

        {/* Positions grouped by theme */}
        {grouped.map(g => (
          <div key={g.id} style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px', background:'rgba(255,255,255,0.02)', borderRadius:'6px 6px 0 0', borderBottom:'1px solid '+g.meta.color+'33' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:g.meta.color }} />
              <span style={{ fontSize:10, color:g.meta.color, letterSpacing:2 }}>{g.meta.label.toUpperCase()}</span>
              <span style={{ fontSize:9, color:DIM, marginLeft:'auto' }}>
                {g.positions.length} positions · ${g.positions.reduce((a,p)=>a+p.mkt,0).toFixed(2)}
              </span>
            </div>
            <div style={{ border:'1px solid rgba(255,255,255,0.06)', borderTop:'none', borderRadius:'0 0 6px 6px', overflow:'hidden' }}>
              {g.positions.map(p => (
                <PosRow key={p.id||p.ticker} pos={p} quote={quotes[p.ticker]} analyst={analysts[p.ticker]} isAlert={p.isAlert} />
              ))}
            </div>
          </div>
        ))}

        {/* Upcoming catalysts */}
        {catalysts.filter(c=>new Date(c.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date)).length>0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:10, color:DIM, letterSpacing:2, marginBottom:8 }}>UPCOMING CATALYSTS</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {catalysts.filter(c=>new Date(c.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date)).map(c=>{
                const days = Math.ceil((new Date(c.date)-new Date())/(1000*60*60*24));
                const urgCol = days<=7?R:days<=14?Y:G;
                return (
                  <div key={c.id||c.ticker+c.date} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderLeft:'3px solid '+urgCol, borderRadius:5, padding:'6px 10px', minWidth:100 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{c.ticker}</div>
                    <div style={{ fontSize:9, color:urgCol, marginTop:1 }}>{days}d · {c.date.slice(5)}</div>
                    <div style={{ fontSize:9, color:DIM, marginTop:2 }}>{c.type}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}