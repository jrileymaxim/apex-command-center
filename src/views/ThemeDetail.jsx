import { useParams, Link } from "react-router-dom";
import { usePortfolio } from "../hooks/usePortfolio";
import { useQuotes } from "../hooks/useQuotes";
import { useState, useEffect } from "react";
import Panel from "../components/hud/Panel";
import Badge from "../components/hud/Badge";
import PositionRow from "../components/PositionRow";
import { fmtUSD, fmtDate } from "../lib/format";

const clr = (v, lo, hi) => v >= hi ? '#00ff88' : v >= lo ? '#fbbf24' : '#ff3355';

function ScenarioCell({ s, spot }) {
  const isNow = Math.abs(s.spot - spot) < 0.05;
  const col = s.pnl >= 0 ? '#00ff88' : '#ff3355';
  return (
    <div style={{padding:'8px 4px',textAlign:'center',background:isNow?'rgba(0,255,136,0.08)':'rgba(255,255,255,0.02)',border:'1px solid '+(isNow?'rgba(0,255,136,0.3)':'rgba(255,255,255,0.06)'),borderRadius:4}}>
      <div style={{fontSize:8,color:'#555',marginBottom:2}}>@${s.spot.toFixed(2)}</div>
      <div style={{fontSize:12,fontWeight:700,color:col,fontFamily:'JetBrains Mono,monospace'}}>{s.pnl>=0?'+':''}{s.pnlPct.toFixed(0)}%</div>
      <div style={{fontSize:9,color:col}}>{s.pnl>=0?'+':''}{fmtUSD(Math.abs(s.pnl))}</div>
    </div>
  );
}

function LeapsCard({ leg }) {
  const beW = Math.min(100,(leg.spot/leg.breakeven)*100);
  const pc = leg.pnl>=0?'#00ff88':'#ff3355';
  return (
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,padding:14,marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:'#fbbf24',letterSpacing:1}}>{leg.label}</div>
          <div style={{fontSize:9,color:'#555',marginTop:2}}>{leg.days}d to expiry · IV {(leg.iv*100).toFixed(0)}%</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:18,fontWeight:900,color:pc,fontFamily:'JetBrains Mono,monospace'}}>{leg.pnl>=0?'+':''}{fmtUSD(leg.pnl)}</div>
          <div style={{fontSize:10,color:pc}}>{leg.pnl>=0?'+':''}{leg.pnlPct.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:10}}>
        {[['Δ DELTA',leg.delta.toFixed(3),clr(leg.delta,0.3,0.5)],['Γ GAMMA',leg.gamma.toFixed(4),'#a78bfa'],['Θ/DAY',fmtUSD(Math.abs(leg.dailyTheta)),'#ff3355'],['V VEGA',leg.vega.toFixed(3),'#60a5fa']].map(([l,v,c])=>(
          <div key={l} style={{textAlign:'center',padding:'6px 4px',background:'rgba(0,0,0,0.2)',borderRadius:4}}>
            <div style={{fontSize:8,color:'#444',marginBottom:2}}>{l}</div>
            <div style={{fontSize:12,fontWeight:700,color:c,fontFamily:'JetBrains Mono,monospace'}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#555',marginBottom:3}}>
        <span>SPOT ${leg.spot.toFixed(2)}</span>
        <span>BE ${leg.breakeven.toFixed(2)} (+{leg.breakevenGapPct.toFixed(1)}%)</span>
      </div>
      <div style={{height:4,background:'rgba(255,255,255,0.05)',borderRadius:2,marginBottom:6}}>
        <div style={{height:'100%',width:beW+'%',background:'#fbbf24',borderRadius:2,transition:'width 0.5s'}}/>
      </div>
      <div style={{display:'flex',gap:8,fontSize:9,color:'#444'}}>
        <span>INTRINSIC {fmtUSD(leg.intrinsic*100)}</span>
        <span>·</span>
        <span>TIME {fmtUSD(leg.timeValue*100)}</span>
        <span>·</span>
        <span>Θ/WK {fmtUSD(Math.abs(leg.weeklyTheta))}</span>
      </div>
    </div>
  );
}

export default function ThemeDetail() {
  const { id } = useParams();
  const { themes, positions, catalysts } = usePortfolio();
  const [optData, setOptData] = useState(null);
  const [optLoading, setOptLoading] = useState(false);
  const [activeLeg, setActiveLeg] = useState(null);

  const theme = themes.find(t => t.id === id);
  const themePositions = positions.filter(p => p.themeIds?.includes(id));
  const tickers = [...new Set(themePositions.map(p => p.ticker))];
  const { quotes } = useQuotes(tickers);
  const isOptions = id === 'options';

  useEffect(() => {
    if (!isOptions) return;
    setOptLoading(true);
    fetch('/api/options').then(r=>r.json()).then(d=>{setOptData(d);setOptLoading(false);}).catch(()=>setOptLoading(false));
  }, [isOptions]);

  if (!theme) return (
    <main className="hud-layout">
      <Link to="/" className="hud-back">← HOME</Link>
      <Panel><p className="empty-state">Theme not found</p></Panel>
    </main>
  );

  const totalValue = themePositions.filter(p=>p.type==='equity').reduce((s,p)=>{
    const price=quotes[p.ticker]?.price;
    return s+(price!=null?price*(p.shares||0):0);
  },0);

  const themeCatalysts = catalysts.filter(c=>{
    const ts=new Set(themePositions.map(p=>p.ticker));
    return ts.has(c.ticker)&&new Date(c.date)>=new Date();
  }).sort((a,b)=>new Date(a.date)-new Date(b.date));

  return (
    <main className="hud-layout">
      <Link to="/" className="hud-back">← HOME</Link>

      <Panel accent={theme.color}>
        <header className="theme-detail-header">
          <h1 style={{color:theme.color}}>{theme.name}</h1>
          {isOptions&&optData ? (
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:10,color:'#555'}}>COMBINED P&L</div>
              <div style={{fontSize:20,fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:optData.combined.totalPnl>=0?'#00ff88':'#ff3355'}}>
                {optData.combined.totalPnl>=0?'+':''}{fmtUSD(optData.combined.totalPnl)}
              </div>
            </div>
          ) : <div className="theme-detail-total">{fmtUSD(totalValue)}</div>}
        </header>
        <p className="theme-detail-thesis">{theme.thesis}</p>
      </Panel>

      {isOptions&&(
        <>
          {optLoading&&<Panel><div style={{fontSize:11,color:'#555',textAlign:'center',padding:20}}>COMPUTING GREEKS...</div></Panel>}
          {optData&&(
            <>
              <Panel>
                <div style={{fontSize:10,color:'#fbbf24',letterSpacing:2,marginBottom:10}}>COMBINED POSITION</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {[['TOTAL COST',fmtUSD(optData.combined.totalCost),'#aaa'],['MKT VALUE',fmtUSD(optData.combined.totalPremium),'#fbbf24'],['SOUN SPOT','$'+optData.spot.toFixed(2),'#60a5fa'],['Σ DELTA',optData.combined.combinedDelta.toFixed(3),clr(optData.combined.combinedDelta,0.6,1.0)],['Σ GAMMA',optData.combined.combinedGamma.toFixed(4),'#a78bfa'],['Θ/DAY',fmtUSD(Math.abs(optData.combined.dailyThetaTotal)),'#ff3355']].map(([l,v,c])=>(
                    <div key={l} style={{textAlign:'center',padding:'8px 6px',background:'rgba(0,0,0,0.2)',borderRadius:4}}>
                      <div style={{fontSize:9,color:'#444',marginBottom:3}}>{l}</div>
                      <div style={{fontSize:13,fontWeight:700,color:c,fontFamily:'JetBrains Mono,monospace'}}>{v}</div>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel>
                <div style={{fontSize:10,color:'#fbbf24',letterSpacing:2,marginBottom:10}}>LEAPS — LIVE GREEKS</div>
                {optData.leaps.map((leg,i)=><LeapsCard key={i} leg={leg}/>)}
              </Panel>
              <Panel>
                <div style={{fontSize:10,color:'#fbbf24',letterSpacing:2,marginBottom:6}}>SCENARIO GRID</div>
                <div style={{display:'flex',gap:6,marginBottom:10}}>
                  {optData.leaps.map((leg,i)=>(
                    <button key={i} onClick={()=>setActiveLeg(activeLeg===i?null:i)} style={{padding:'4px 10px',fontSize:9,background:activeLeg===i?'rgba(251,191,36,0.15)':'rgba(255,255,255,0.03)',border:'1px solid '+(activeLeg===i?'#fbbf24':'rgba(255,255,255,0.1)'),color:activeLeg===i?'#fbbf24':'#666',borderRadius:4,cursor:'pointer'}}>
                      {leg.label.includes('27')?'1/27':'1/28'}
                    </button>
                  ))}
                  <span style={{fontSize:9,color:'#333',alignSelf:'center',marginLeft:4}}>tap to isolate leg</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
                  {(activeLeg!==null?[optData.leaps[activeLeg]]:optData.leaps).flatMap((leg)=>
                    leg.scenarios.map((s,si)=><ScenarioCell key={leg.label+si} s={s} spot={optData.spot}/>)
                  )}
                </div>
              </Panel>
              <Panel>
                <div style={{fontSize:10,color:'#fbbf24',letterSpacing:2,marginBottom:10}}>THETA CLOCK</div>
                {optData.leaps.map((leg,i)=>{
                  const elapsed=365-leg.days;
                  const pct=Math.min(100,(elapsed/365)*100);
                  return(
                    <div key={i} style={{marginBottom:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#555',marginBottom:4}}>
                        <span>{leg.label}</span>
                        <span style={{color:'#ff3355'}}>{fmtUSD(Math.abs(leg.dailyTheta))}/day · {fmtUSD(Math.abs(leg.weeklyTheta))}/wk</span>
                      </div>
                      <div style={{height:6,background:'rgba(255,255,255,0.05)',borderRadius:3}}>
                        <div style={{height:'100%',width:pct+'%',background:'linear-gradient(90deg,#fbbf24,#ff3355)',borderRadius:3}}/>
                      </div>
                      <div style={{fontSize:9,color:'#333',marginTop:2}}>{leg.days}d remaining · {pct.toFixed(0)}% of year elapsed</div>
                    </div>
                  );
                })}
              </Panel>
            </>
          )}
          {themeCatalysts.length>0&&(
            <Panel>
              <div style={{fontSize:10,color:'#fbbf24',letterSpacing:2,marginBottom:10}}>CATALYSTS</div>
              {themeCatalysts.map(c=>(
                <div key={c.id||c.ticker} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <span style={{fontSize:10,color:'#fbbf24',minWidth:70,fontFamily:'JetBrains Mono,monospace'}}>{fmtDate(c.date)}</span>
                  <span style={{fontSize:11,fontWeight:700,color:'#fff',minWidth:50}}>{c.ticker}</span>
                  <span style={{fontSize:10,color:'#555',flex:1}}>{c.notes}</span>
                  {c.importance>=5&&<Badge variant="warn">HIGH</Badge>}
                </div>
              ))}
            </Panel>
          )}
        </>
      )}

      {!isOptions&&(
        <Panel accent={theme.color}>
          <div className="theme-detail-section">
            <h3 className="section-heading">Positions</h3>
            <div className="position-list">
              {themePositions.map(p=><PositionRow key={p.id||p.ticker} position={p} quote={quotes[p.ticker]}/>)}
            </div>
          </div>
          {themeCatalysts.length>0&&(
            <div className="theme-detail-section">
              <h3 className="section-heading">Upcoming Catalysts</h3>
              <div className="catalyst-list">
                {themeCatalysts.map(c=>(
                  <div key={c.id} className="catalyst-item">
                    <span className="catalyst-date">{fmtDate(c.date)}</span>
                    <span className="catalyst-ticker">{c.ticker}</span>
                    <span className="catalyst-type">{c.type}</span>
                    {c.importance>=4&&<Badge variant="warn">importance {c.importance}</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}
    </main>
  );
}