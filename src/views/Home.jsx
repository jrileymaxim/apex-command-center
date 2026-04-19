import { usePortfolio } from "../hooks/usePortfolio";
import { useQuotes } from "../hooks/useQuotes";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ClusterBanner from "../components/ClusterBanner";

const THEME_META = {
  'water-infra': { label:'Water',    color:'#2AFF8F' },
  'ai-infra':    { label:'AI Infra', color:'#FF9F2A' },
  'macro':       { label:'Macro',    color:'#FFD700' },
  'speculative': { label:'Spec',     color:'#FF4A6E' },
  'aviation':    { label:'Aviation', color:'#60A5FA' },
  'options':     { label:'Options',  color:'#B84AFF' },
};

const G='#2AFF8F', R='#FF4A6E', Y='#FFD700', DIM='rgba(255,255,255,0.35)';
const col = v => v > 0 ? G : v < 0 ? R : DIM;
const sgn = v => v >= 0 ? '+' : '';
const REFRESH_MS = 60_000;

function StatCard({ label, value, valueColor, sub }) {
  return (
    <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"12px 14px"}}>
      <div style={{fontSize:10,color:DIM,letterSpacing:2,marginBottom:4}}>{label}</div>
      <div style={{fontSize:20,fontWeight:700,color:valueColor||"#fff",fontFamily:"JetBrains Mono,monospace",lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:11,color:DIM,marginTop:3}}>{sub}</div>}
    </div>
  );
}

function LeapsMini({ onData }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/api/options").then(r=>r.json()).then(d=>{ setData(d); onData && onData(d); }).catch(()=>{});
  }, []);
  if (!data) return null;
  const { combined, leaps } = data;
  return (
    <div style={{background:"rgba(184,74,255,0.06)",border:"1px solid rgba(184,74,255,0.25)",borderRadius:8,padding:"12px 16px",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div>
          <div style={{fontSize:10,color:"#B84AFF",letterSpacing:2,marginBottom:2}}>SOUN LEAPS</div>
          <div style={{fontSize:11,color:DIM}}>2 contracts · $10C · SOUN @ ${data.spot.toFixed(2)}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:22,fontWeight:700,color:combined.totalPnl>=0?G:R,fontFamily:"JetBrains Mono,monospace"}}>
            {combined.totalPnl>=0?"+":" "}{Math.abs(combined.totalPnl).toFixed(0)}
          </div>
          <div style={{fontSize:11,color:combined.totalPnl>=0?G:R}}>
            {((combined.totalPnl/combined.totalCost)*100).toFixed(1)}% · cost ${combined.totalCost.toFixed(0)}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        {leaps.map((l,i) => {
          const bePct = Math.min(100,(data.spot/l.breakeven)*100);
          return (
            <div key={i} style={{background:"rgba(0,0,0,0.2)",borderRadius:6,padding:"8px 10px"}}>
              <div style={{fontSize:10,color:"#B84AFF",marginBottom:4}}>{l.expiry.slice(2).replace(/-/g,"/")}</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:6}}>
                <span style={{color:DIM}}>Δ {l.delta.toFixed(3)}</span>
                <span style={{color:DIM}}>Θ ${Math.abs(l.dailyTheta).toFixed(2)}/d</span>
                <span style={{color:l.pnl>=0?G:R}}>{l.pnl>=0?"+":" "}{Math.abs(l.pnl).toFixed(0)}</span>
              </div>
              <div style={{height:3,background:"rgba(255,255,255,0.08)",borderRadius:2}}>
                <div style={{height:"100%",width:bePct+"%",background:"#B84AFF",borderRadius:2}}/>
              </div>
              <div style={{fontSize:9,color:DIM,marginTop:2,textAlign:"right"}}>BE ${l.breakeven} · {bePct.toFixed(0)}%</div>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:16,fontSize:10,color:DIM}}>
          <span>ΣΔ {combined.combinedDelta.toFixed(3)}</span>
          <span>Θ ${Math.abs(combined.dailyThetaTotal).toFixed(2)}/day</span>
        </div>
        <Link to="/theme/options" style={{fontSize:10,color:"#B84AFF",textDecoration:"none",letterSpacing:1}}>FULL GREEKS →</Link>
      </div>
    </div>
  );
}

function PosRow({ pos, quote, rhPnl, analyst }) {
  const price = quote?.price ?? null;
  const dayPct = quote?.chgPct ?? null;
  const gainAmt = rhPnl ? rhPnl.gainAmt : (price && pos.avgCost ? (price - pos.avgCost) * pos.shares : null);
  const gainPct = rhPnl ? rhPnl.gainPct : (pos.avgCost && gainAmt !== null ? gainAmt / (pos.avgCost * pos.shares) * 100 : null);
  const theme = THEME_META[pos.themeIds?.[0]] || { label:"—", color:"#888" };
  const upside = analyst?.mean && price ? ((analyst.mean - price) / price * 100) : null;
  const isAlert = dayPct !== null && Math.abs(dayPct) >= 3;
  return (
    <div style={{display:"grid",gridTemplateColumns:"44px 1fr 70px 68px 80px 80px 50px",gap:6,alignItems:"center",padding:"8px 12px",background:isAlert?"rgba(255,215,0,0.04)":"transparent",borderBottom:"1px solid rgba(255,255,255,0.05)",borderLeft:isAlert?"2px solid "+Y:"2px solid transparent"}}>
      <span style={{fontSize:13,fontWeight:700,color:"#fff",fontFamily:"JetBrains Mono,monospace"}}>{pos.ticker}</span>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:9,padding:"2px 5px",background:theme.color+"22",color:theme.color,borderRadius:3}}>{theme.label}</span>
        <span style={{fontSize:10,color:DIM}}>{pos.shares}sh</span>
      </div>
      <span style={{fontSize:11,color:DIM,textAlign:"right"}}>{price?"$"+price.toFixed(2):"—"}</span>
      <span style={{fontSize:11,color:col(dayPct||0),textAlign:"right",fontFamily:"JetBrains Mono,monospace"}}>{dayPct!==null?(sgn(dayPct)+dayPct.toFixed(2)+"%"):"—"}</span>
      <span style={{fontSize:11,color:gainAmt!==null?col(gainAmt):DIM,textAlign:"right",fontFamily:"JetBrains Mono,monospace"}}>{gainAmt!==null?(sgn(gainAmt)+"$"+Math.abs(gainAmt).toFixed(2)):"—"}</span>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:11,color:gainPct!==null?col(gainPct):DIM,fontFamily:"JetBrains Mono,monospace"}}>{gainPct!==null?(sgn(gainPct)+gainPct.toFixed(2)+"%"):"—"}</div>
        {upside!==null&&<div style={{fontSize:9,color:upside>0?G:R}}>{sgn(upside)+upside.toFixed(0)}% to tgt</div>}
      </div>
      <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
        {gainPct!==null&&<div style={{height:"100%",width:Math.min(100,Math.abs(gainPct)*3)+"%",background:gainPct>=0?G:R,borderRadius:2,opacity:0.7}}/>}
      </div>
    </div>
  );
}

export default function Home() {
  const { positions, catalysts: seedCatalysts } = usePortfolio();
  const [catalysts, setCatalysts] = useState(seedCatalysts);
  const [analysts, setAnalysts] = useState({});
  const [optData, setOptData] = useState(null);
  const [now, setNow] = useState(new Date());

  const equityPositions = positions.filter(p => p.type === "equity");
  const tickers = [...new Set(equityPositions.map(p => p.ticker))];
  const { quotes, loading, refresh } = useQuotes(tickers);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => refresh?.(), REFRESH_MS); return () => clearInterval(t); }, [refresh]);
  useEffect(() => {
    fetch("/api/catalysts").then(r=>r.json()).then(d=>{ if(d.catalysts?.length) setCatalysts(d.catalysts); }).catch(()=>{});
    fetch("/api/analysts").then(r=>r.json()).then(d=>{ if(d.targets) setAnalysts(d.targets); }).catch(()=>{});
  }, []);

  // RH actuals from portfolio seed
  const portfolio = positions; // placeholder — rhActuals stored in seed
  const RH_ACTUALS = {
    AAL:{gainAmt:17.24,gainPct:12.01},MNTS:{gainAmt:6.17,gainPct:2.80},
    ANET:{gainAmt:42.43,gainPct:14.81},TSM:{gainAmt:-20.29,gainPct:-0.80},
    MU:{gainAmt:39.68,gainPct:9.52},NVDA:{gainAmt:48.57,gainPct:5.42},
    SOUN:{gainAmt:-0.23,gainPct:-0.94},VTI:{gainAmt:36.16,gainPct:3.56},
    CRWV:{gainAmt:55.89,gainPct:4.58},GLD:{gainAmt:1.86,gainPct:1.06},
    BBAI:{gainAmt:17.50,gainPct:9.83},XYL:{gainAmt:-0.01,gainPct:-0.84},
    PNR:{gainAmt:-0.72,gainPct:-0.78},AWK:{gainAmt:1.11,gainPct:0.85},
    VLTO:{gainAmt:-0.36,gainPct:-0.77},GWRS:{gainAmt:0.20,gainPct:0.26},
    CDZI:{gainAmt:-0.36,gainPct:-0.82},GRC:{gainAmt:-0.05,gainPct:-1.67},
  };
  const LEAPS_COST = 362.04;

  // True P&L: RH actuals + live options
  const stockPnl = Object.values(RH_ACTUALS).reduce((a,v)=>a+v.gainAmt,0);
  const leapsPnl = optData ? optData.combined.totalPnl : 132.00;
  const leapsCost = optData ? optData.combined.totalCost : LEAPS_COST;
  const totalPnl = stockPnl + leapsPnl;
  const equityMkt = equityPositions.reduce((a,p)=>{ const price=quotes[p.ticker]?.price??p.avgCost; return a+price*p.shares; },0);
  const leapsMkt = optData ? optData.combined.totalPremium : (LEAPS_COST + leapsPnl);
  const totalMkt = equityMkt + leapsMkt;
  const equityCost = equityPositions.reduce((a,p)=>a+(p.avgCost||0)*p.shares,0);
  const totalCost = equityCost + LEAPS_COST;
  const totalPct = totalCost > 0 ? (totalPnl/totalCost)*100 : 0;
  const dayPnl = equityPositions.reduce((a,p)=>{ const q=quotes[p.ticker]; if(!q?.price||!q?.chgPct) return a; const prev=q.price/(1+q.chgPct/100); return a+(q.price-prev)*p.shares; },0);
  const alerts = equityPositions.filter(p=>{ const c=quotes[p.ticker]?.chgPct; return c!==undefined&&Math.abs(c)>=3; }).length;

  const THEME_ORDER = ["water-infra","ai-infra","macro","speculative","aviation"];
  const grouped = THEME_ORDER.map(tid => ({
    id:tid, meta:THEME_META[tid],
    positions:equityPositions.filter(p=>p.themeIds?.includes(tid)).sort((a,b)=>Math.abs(quotes[b.ticker]?.chgPct||0)-Math.abs(quotes[a.ticker]?.chgPct||0)),
  })).filter(g2=>g2.positions.length>0);

  const pad2 = n => String(n).padStart(2,"0");
  const timeStr = pad2(now.getHours())+":"+pad2(now.getMinutes())+":"+pad2(now.getSeconds());

  return (
    <main style={{minHeight:"100vh",background:"#080810",color:"#fff",fontFamily:"JetBrains Mono,monospace",padding:"0 0 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.4)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:loading?Y:G,boxShadow:"0 0 8px "+(loading?Y:G)}}/>
          <span style={{fontSize:13,fontWeight:700,letterSpacing:4,color:"#fff"}}>APEX</span>
          <span style={{fontSize:10,color:DIM,letterSpacing:2}}>COMMAND CENTER</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          {alerts>0&&<span style={{fontSize:10,color:Y,padding:"2px 8px",border:"1px solid "+Y+"44",borderRadius:4}}>⚡ {alerts} MOVERS</span>}
          <span style={{fontSize:14,fontWeight:700,color:"#fff",fontFamily:"JetBrains Mono,monospace"}}>{timeStr}</span>
        </div>
      </div>
      <div style={{maxWidth:980,margin:"0 auto",padding:"16px 20px"}}>
        <ClusterBanner catalysts={catalysts}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,margin:"14px 0"}}>
          <StatCard label="PORTFOLIO VALUE" value={"$"+totalMkt.toFixed(2)}/>
          <StatCard label="DAY P&L" value={(dayPnl>=0?"+":"")+("$"+Math.abs(dayPnl).toFixed(2))} valueColor={col(dayPnl)} sub={loading?"loading…":"live · all positions"}/>
          <StatCard label="TOTAL RETURN" value={(totalPnl>=0?"+":"")+("$"+Math.abs(totalPnl).toFixed(2))} valueColor={col(totalPnl)} sub="stocks + LEAPS"/>
          <StatCard label="RETURN %" value={(totalPct>=0?"+":"")+totalPct.toFixed(2)+"%"} valueColor={col(totalPct)} sub={equityPositions.length+" positions + LEAPS"}/>
        </div>
        <LeapsMini onData={setOptData}/>
        <div style={{display:"grid",gridTemplateColumns:"44px 1fr 70px 68px 80px 80px 50px",gap:6,padding:"6px 12px",marginBottom:4}}>
          {["TICKER","THEME","PRICE","DAY","P&L","RETURN",""].map(h=>(<span key={h} style={{fontSize:9,color:DIM,letterSpacing:1}}>{h}</span>))}
        </div>
        {grouped.map(grp => (
          <div key={grp.id} style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 12px",background:"rgba(255,255,255,0.02)",borderRadius:"6px 6px 0 0",borderBottom:"1px solid "+grp.meta.color+"33"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:grp.meta.color}}/>
              <span style={{fontSize:10,color:grp.meta.color,letterSpacing:2}}>{grp.meta.label.toUpperCase()}</span>
              <span style={{fontSize:9,color:DIM,marginLeft:"auto"}}>{grp.positions.length} positions · ${grp.positions.reduce((a,p)=>{ const px=quotes[p.ticker]?.price??p.avgCost; return a+px*p.shares; },0).toFixed(2)}</span>
            </div>
            <div style={{border:"1px solid rgba(255,255,255,0.06)",borderTop:"none",borderRadius:"0 0 6px 6px",overflow:"hidden"}}>
              {grp.positions.map(p=>(
                <PosRow key={p.id||p.ticker} pos={p} quote={quotes[p.ticker]} rhPnl={RH_ACTUALS[p.ticker]??null} analyst={analysts[p.ticker]}/>
              ))}
            </div>
          </div>
        ))}
        {catalysts.filter(c=>new Date(c.date)>=new Date()).length>0&&(
          <div style={{marginTop:8}}>
            <div style={{fontSize:10,color:DIM,letterSpacing:2,marginBottom:8}}>UPCOMING CATALYSTS</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {catalysts.filter(c=>new Date(c.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date)).map(c=>{
                const days=Math.ceil((new Date(c.date)-new Date())/(1000*60*60*24));
                const urgCol=days<=7?R:days<=14?Y:G;
                return(
                  <div key={c.id||c.ticker+c.date} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderLeft:"3px solid "+urgCol,borderRadius:5,padding:"6px 10px",minWidth:90}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#fff"}}>{c.ticker}</div>
                    <div style={{fontSize:9,color:urgCol,marginTop:1}}>{days}d · {c.date.slice(5)}</div>
                    <div style={{fontSize:9,color:DIM,marginTop:2}}>{c.type}</div>
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
