import { usePortfolio } from "../hooks/usePortfolio";
import { useQuotes } from "../hooks/useQuotes";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import ClusterBanner from "../components/ClusterBanner";

const THEME_META = {
  'water-infra':{ label:'Water',   color:'#2AFF8F' },
  'ai-infra':   { label:'AI Infra',color:'#FF9F2A' },
  'macro':      { label:'Macro',   color:'#FFD700' },
  'speculative':{ label:'Spec',    color:'#FF4A6E' },
  'aviation':   { label:'Aviation',color:'#60A5FA' },
  'options':    { label:'Options', color:'#B84AFF' },
};

const G='#2AFF8F',R='#FF4A6E',Y='#FFD700',DIM='rgba(255,255,255,0.35)';
const col = v => v > 0 ? G : v < 0 ? R : DIM;
const sgn = v => v >= 0 ? '+' : '';
const SYNC_KEY = "apex-sync-v1";
const REFRESH_MS = 60_000;

function SyncModal({ onSave, onClose, current }) {
  const [val, setVal] = useState(current?.portfolioValue || "");
  const [ret, setRet] = useState(current?.totalReturn || "");
  const [dep, setDep] = useState(current?.amountDeposited || "");
  const pv = parseFloat(String(val).replace(/[$,]/g,"")) || 0;
  const tr = parseFloat(String(ret).replace(/[$,+-]/g,"")) * (String(ret).trim().startsWith("-")?-1:1) || 0;
  const ad = parseFloat(String(dep).replace(/[$,]/g,"")) || 0;
  const returnPct = ad > 0 ? (tr/ad*100) : 0;
  const margin = pv > 0 && ad > 0 ? Math.max(0, pv - ad - tr) : 0;
  function save() {
    if (!pv || !ad) return;
    onSave({ portfolioValue:pv, totalReturn:tr, amountDeposited:ad, syncedAt:new Date().toISOString() });
    onClose();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#0e0e1a",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:28,width:380,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:11,color:"#B84AFF",letterSpacing:3,marginBottom:4}}>ROBINHOOD SYNC</div>
        <div style={{fontSize:12,color:DIM,marginBottom:20,lineHeight:1.6}}>
          Open Robinhood → Portfolio screen. Paste 3 numbers below. Takes 10 seconds.
        </div>
        {[
          ["Portfolio Value","Total account value shown at top of Robinhood",val,setVal,"e.g. 8,420.15"],
          ["Total Return $","The green/red P&L number (realized + unrealized)",ret,setRet,"e.g. +376.79 or -50.00"],
          ["Amount Deposited","Your net cash deposited (not margin)",dep,setDep,"e.g. 7,500.00"],
        ].map(([label,hint,v,set,ph])=>(
          <div key={label} style={{marginBottom:14}}>
            <div style={{fontSize:10,color:"#fff",letterSpacing:1,marginBottom:4}}>{label}</div>
            <div style={{fontSize:9,color:DIM,marginBottom:5}}>{hint}</div>
            <input
              value={v}
              onChange={e=>set(e.target.value)}
              placeholder={ph}
              style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,padding:"8px 12px",color:"#fff",fontSize:13,fontFamily:"JetBrains Mono,monospace",outline:"none",boxSizing:"border-box"}}
            />
          </div>
        ))}
        {pv > 0 && ad > 0 && (
          <div style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"10px 14px",marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              ["Return %",(returnPct>=0?"+":"")+returnPct.toFixed(2)+"%",col(returnPct)],
              ["Margin Used",margin>0?("$"+margin.toFixed(2)):"None",margin>0?Y:G],
              ["True Equity","$"+(ad+tr).toFixed(2),G],
              ["Portfolio Val","$"+pv.toFixed(2),"#fff"],
            ].map(([l,v2,c])=>(
              <div key={l}>
                <div style={{fontSize:9,color:DIM}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:c,fontFamily:"JetBrains Mono,monospace"}}>{v2}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"10px",background:"transparent",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,color:DIM,cursor:"pointer",fontSize:11}}>Cancel</button>
          <button onClick={save} disabled={!pv||!ad} style={{flex:2,padding:"10px",background:pv&&ad?"rgba(184,74,255,0.2)":"rgba(255,255,255,0.04)",border:"1px solid "+(pv&&ad?"#B84AFF":"rgba(255,255,255,0.08)"),borderRadius:6,color:pv&&ad?"#B84AFF":DIM,cursor:pv&&ad?"pointer":"default",fontSize:11,fontWeight:700,letterSpacing:2}}>SYNC →</button>
        </div>
      </div>
    </div>
  );
}

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
    fetch("/api/options").then(r=>r.json()).then(d=>{ setData(d); onData&&onData(d); }).catch(()=>{});
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
            {combined.totalPnl>=0?"+":" "}${Math.abs(combined.totalPnl).toFixed(0)}
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
                <span style={{color:l.pnl>=0?G:R}}>{l.pnl>=0?"+":" "}${Math.abs(l.pnl).toFixed(0)}</span>
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
  const gainAmt = rhPnl ? rhPnl.gainAmt : (price&&pos.avgCost?(price-pos.avgCost)*pos.shares:null);
  const gainPct = rhPnl ? rhPnl.gainPct : (pos.avgCost&&gainAmt!==null?gainAmt/(pos.avgCost*pos.shares)*100:null);
  const theme = THEME_META[pos.themeIds?.[0]]||{label:"—",color:"#888"};
  const upside = analyst?.mean&&price?((analyst.mean-price)/price*100):null;
  const isAlert = dayPct!==null&&Math.abs(dayPct)>=3;
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

export default function Home() {
  const { positions, catalysts: seedCatalysts } = usePortfolio();
  const [catalysts, setCatalysts] = useState(seedCatalysts);
  const [analysts, setAnalysts] = useState({});
  const [optData, setOptData] = useState(null);
  const [now, setNow] = useState(new Date());
  const [showSync, setShowSync] = useState(false);
  const [sync, setSync] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SYNC_KEY)) || null; } catch(e) { return null; }
  });

  const equityPositions = positions.filter(p => p.type === "equity");
  const tickers = [...new Set(equityPositions.map(p => p.ticker))];
  const { quotes, loading, refresh } = useQuotes(tickers);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => refresh?.(), REFRESH_MS); return () => clearInterval(t); }, [refresh]);
  useEffect(() => {
    fetch("/api/catalysts").then(r=>r.json()).then(d=>{ if(d.catalysts?.length) setCatalysts(d.catalysts); }).catch(()=>{});
    fetch("/api/analysts").then(r=>r.json()).then(d=>{ if(d.targets) setAnalysts(d.targets); }).catch(()=>{});
  }, []);

  const saveSync = useCallback((data) => {
    localStorage.setItem(SYNC_KEY, JSON.stringify(data));
    setSync(data);
  }, []);

  // Summary numbers — synced values take priority, fall back to calculated
  const leapsPnl = optData ? optData.combined.totalPnl : 132.00;
  const leapsCost = optData ? optData.combined.totalCost : 362.04;
  const leapsMkt = optData ? optData.combined.totalPremium : (leapsCost + leapsPnl);

  const portfolioValue = sync ? sync.portfolioValue : (equityPositions.reduce((a,p)=>{ const px=quotes[p.ticker]?.price??p.avgCost; return a+px*p.shares; },0) + leapsMkt);
  const totalReturn = sync ? sync.totalReturn : (Object.values(RH_ACTUALS).reduce((a,v)=>a+v.gainAmt,0) + leapsPnl);
  const amountDeposited = sync ? sync.amountDeposited : null;
  const returnPct = amountDeposited ? (totalReturn/amountDeposited*100) : null;
  const marginUsed = sync ? Math.max(0, sync.portfolioValue - sync.amountDeposited - sync.totalReturn) : 0;

  // Day P&L from live prices (always calculated — accurate for current day)
  const dayPnl = equityPositions.reduce((a,p)=>{ const q=quotes[p.ticker]; if(!q?.price||!q?.chgPct) return a; const prev=q.price/(1+q.chgPct/100); return a+(q.price-prev)*p.shares; },0);

  const alerts = equityPositions.filter(p=>{ const c=quotes[p.ticker]?.chgPct; return c!==undefined&&Math.abs(c)>=3; }).length;

  // Sync age
  const syncAge = sync ? (() => {
    const mins = Math.floor((Date.now()-new Date(sync.syncedAt))/(1000*60));
    if (mins < 60) return mins+"m ago";
    const hrs = Math.floor(mins/60);
    return hrs+"h ago";
  })() : null;

  const THEME_ORDER = ["water-infra","ai-infra","macro","speculative","aviation"];
  const grouped = THEME_ORDER.map(tid => ({
    id:tid, meta:THEME_META[tid],
    positions:equityPositions.filter(p=>p.themeIds?.includes(tid)).sort((a,b)=>Math.abs(quotes[b.ticker]?.chgPct||0)-Math.abs(quotes[a.ticker]?.chgPct||0)),
  })).filter(g=>g.positions.length>0);

  const pad2 = n => String(n).padStart(2,"0");
  const timeStr = pad2(now.getHours())+":"+pad2(now.getMinutes())+":"+pad2(now.getSeconds());

  return (
    <main style={{minHeight:"100vh",background:"#080810",color:"#fff",fontFamily:"JetBrains Mono,monospace",padding:"0 0 40px"}}>
      {showSync&&<SyncModal onSave={saveSync} onClose={()=>setShowSync(false)} current={sync}/>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.4)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:loading?Y:G,boxShadow:"0 0 8px "+(loading?Y:G)}}/>
          <span style={{fontSize:13,fontWeight:700,letterSpacing:4,color:"#fff"}}>APEX</span>
          <span style={{fontSize:10,color:DIM,letterSpacing:2}}>COMMAND CENTER</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {alerts>0&&<span style={{fontSize:10,color:Y,padding:"2px 8px",border:"1px solid "+Y+"44",borderRadius:4}}>⚡ {alerts} MOVERS</span>}
          <button onClick={()=>setShowSync(true)} style={{fontSize:10,padding:"4px 12px",background:sync?"rgba(0,255,136,0.08)":"rgba(184,74,255,0.12)",border:"1px solid "+(sync?"#2AFF8F44":"#B84AFF66"),borderRadius:5,color:sync?G:"#B84AFF",cursor:"pointer",letterSpacing:1}}>
            {sync?("● SYNCED · "+syncAge):"↻ SYNC RH"}
          </button>
          <span style={{fontSize:14,fontWeight:700,color:"#fff",fontFamily:"JetBrains Mono,monospace"}}>{timeStr}</span>
        </div>
      </div>

      <div style={{maxWidth:980,margin:"0 auto",padding:"16px 20px"}}>
        <ClusterBanner catalysts={catalysts}/>

        {!sync&&(
          <div style={{background:"rgba(184,74,255,0.06)",border:"1px dashed rgba(184,74,255,0.3)",borderRadius:8,padding:"12px 16px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,color:"#B84AFF",marginBottom:2}}>P&L SHOWING ESTIMATES ONLY</div>
              <div style={{fontSize:10,color:DIM}}>Sync with Robinhood for accurate totals including realized gains, margin, and options.</div>
            </div>
            <button onClick={()=>setShowSync(true)} style={{fontSize:11,padding:"8px 16px",background:"rgba(184,74,255,0.15)",border:"1px solid #B84AFF",borderRadius:6,color:"#B84AFF",cursor:"pointer",whiteSpace:"nowrap"}}>SYNC NOW →</button>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,margin:"14px 0"}}>
          <StatCard label="PORTFOLIO VALUE" value={"$"+portfolioValue.toFixed(2)} sub={sync?"as of "+syncAge:"estimated"}/>
          <StatCard label="DAY P&L" value={(dayPnl>=0?"+":"")+"$"+Math.abs(dayPnl).toFixed(2)} valueColor={col(dayPnl)} sub={loading?"loading…":"live · today only"}/>
          <StatCard label="TOTAL RETURN" value={(totalReturn>=0?"+":"")+"$"+Math.abs(totalReturn).toFixed(2)} valueColor={col(totalReturn)} sub={sync?"realized + unrealized":"stocks + LEAPS est."}/>
          <StatCard
            label="RETURN %"
            value={returnPct!==null?((returnPct>=0?"+":"")+returnPct.toFixed(2)+"%"):"SYNC FOR %"}
            valueColor={returnPct!==null?col(returnPct):"#B84AFF"}
            sub={marginUsed>0?"margin: $"+marginUsed.toFixed(0):sync?("deposited $"+amountDeposited.toFixed(0)):null}
          />
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
              <span style={{fontSize:9,color:DIM,marginLeft:"auto"}}>
                {grp.positions.length} positions · ${grp.positions.reduce((a,p)=>{ const px=quotes[p.ticker]?.price??p.avgCost; return a+px*p.shares; },0).toFixed(2)}
              </span>
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
