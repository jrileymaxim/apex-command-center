import { useState } from "react";

const DIM = 'rgba(255,255,255,0.35)';
const G = '#2AFF8F', R = '#FF4A6E', Y = '#FFD700';
const col = v => v > 0 ? G : v < 0 ? R : DIM;

function parseRobinhoodPaste(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const positions = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^[A-Z]{1,5}$/.test(line)) {
      const ticker = line;
      let shares = null, gainAmt = null, gainPct = null;
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const l = lines[j];
        if (/^[\d.]+\s+shares?$/.test(l)) { shares = parseFloat(l); }
        else if (/^[+-]\$[\d,.]+$/.test(l)) {
          gainAmt = parseFloat(l.replace(/[^0-9.]/g, '')) * (l.startsWith('-') ? -1 : 1);
        }
        else if (/^[+-][\d.]+%$/.test(l)) {
          gainPct = parseFloat(l.replace(/[^0-9.]/g, '')) * (l.startsWith('-') ? -1 : 1);
          if (gainAmt !== null) break;
        }
        else if (/^[A-Z]{1,5}$/.test(l) && j > i + 1) break;
      }
      if (gainAmt !== null || gainPct !== null) {
        positions[ticker] = { gainAmt: gainAmt ?? 0, gainPct: gainPct ?? 0, shares };
      }
      i++;
    } else { i++; }
  }
  return positions;
}

export default function SyncModal({ onSave, onClose, current }) {
  const [step, setStep] = useState(1);
  const [val, setVal] = useState(current?.portfolioValue || '');
  const [ret, setRet] = useState(current?.totalReturn || '');
  const [dep, setDep] = useState(current?.amountDeposited || '');
  const [paste, setPaste] = useState('');
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState('');

  const pv = parseFloat(String(val).replace(/[$,]/g, '')) || 0;
  const retStr = String(ret).trim();
  const tr = parseFloat(retStr.replace(/[$,+]/g, '')) * (retStr.startsWith('-') ? -1 : 1) || 0;
  const ad = parseFloat(String(dep).replace(/[$,]/g, '')) || 0;
  const returnPct = ad > 0 ? (tr / ad * 100) : 0;
  const margin = pv > 0 && ad > 0 ? Math.max(0, pv - ad - tr) : 0;

  function handlePaste(text) {
    setPaste(text);
    if (!text.trim()) { setParsed(null); setParseError(''); return; }
    const result = parseRobinhoodPaste(text);
    const count = Object.keys(result).length;
    if (count === 0) { setParseError('Could not parse any positions. Copy from the Robinhood stock list.'); setParsed(null); }
    else { setParseError(''); setParsed(result); }
  }

  function save() {
    if (!pv || !ad) return;
    onSave({ portfolioValue: pv, totalReturn: tr, amountDeposited: ad, syncedAt: new Date().toISOString(), positions: parsed || current?.positions || null });
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 28, width: 440, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: '#B84AFF', letterSpacing: 3 }}>ROBINHOOD SYNC</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2].map(s => (<div key={s} style={{ width: 24, height: 4, borderRadius: 2, background: step >= s ? '#B84AFF' : 'rgba(255,255,255,0.1)', cursor: 'pointer' }} onClick={() => pv && ad && setStep(s)} />))}
          </div>
        </div>
        <div style={{ fontSize: 11, color: DIM, marginBottom: 20 }}>
          {step === 1 ? 'Step 1 of 2 — Summary numbers' : 'Step 2 of 2 — Position P&L (paste from Robinhood)'}
        </div>

        {step === 1 && (
          <>
            {[
              ['Portfolio Value', 'Total account value at top of Robinhood', val, setVal, 'e.g. 8420.15'],
              ['Total Return $', 'Green/red P&L — all time (realized + unrealized)', ret, setRet, 'e.g. +376.79'],
              ['Amount Deposited', 'Your net cash deposited (not margin)', dep, setDep, 'e.g. 7500.00'],
            ].map(([label, hint, v, set, ph]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#fff', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 9, color: DIM, marginBottom: 5 }}>{hint}</div>
                <input value={v} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'JetBrains Mono,monospace', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            {pv > 0 && ad > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['Return %',(returnPct>=0?'+':'')+returnPct.toFixed(2)+'%',col(returnPct)],['Margin',margin>0?'$'+margin.toFixed(0):'None',margin>0?Y:G],['True Equity','$'+(ad+tr).toFixed(2),G],['Portfolio','$'+pv.toFixed(2),'#fff']].map(([l,v2,c])=>(
                  <div key={l}><div style={{fontSize:9,color:DIM}}>{l}</div><div style={{fontSize:13,fontWeight:700,color:c,fontFamily:'JetBrains Mono,monospace'}}>{v2}</div></div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex:1,padding:'10px',background:'transparent',border:'1px solid rgba(255,255,255,0.12)',borderRadius:6,color:DIM,cursor:'pointer',fontSize:11 }}>Cancel</button>
              <button onClick={save} disabled={!pv||!ad} style={{ flex:1,padding:'10px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:6,color:DIM,cursor:pv&&ad?'pointer':'default',fontSize:11 }}>Save only</button>
              <button onClick={()=>pv&&ad&&setStep(2)} disabled={!pv||!ad} style={{ flex:1,padding:'10px',background:pv&&ad?'rgba(184,74,255,0.2)':'rgba(255,255,255,0.04)',border:'1px solid '+(pv&&ad?'#B84AFF':'rgba(255,255,255,0.08)'),borderRadius:6,color:pv&&ad?'#B84AFF':DIM,cursor:pv&&ad?'pointer':'default',fontSize:11,fontWeight:700 }}>Next &#8594;</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 10, color: '#fff', marginBottom: 6 }}>Paste your Robinhood stock list</div>
            <div style={{ fontSize: 10, color: DIM, marginBottom: 12, lineHeight: 1.6 }}>
              On Robinhood, scroll to your positions. Select all the text from the first ticker down to the last %. Paste below — APEX will parse every ticker, shares, and P&amp;L automatically.
            </div>
            <textarea value={paste} onChange={e=>handlePaste(e.target.value)}
              placeholder={'AAL\n12.70 shares\n+$17.24\n+12.01%\nNVDA\n4.7 shares\n+$48.57\n+5.42%\n...'}
              rows={10} style={{ width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:6,padding:'10px 12px',color:'#fff',fontSize:11,fontFamily:'JetBrains Mono,monospace',outline:'none',boxSizing:'border-box',resize:'vertical',lineHeight:1.5 }}
            />
            {parseError && <div style={{ fontSize:10,color:R,marginTop:6 }}>{parseError}</div>}
            {parsed && (
              <div style={{ marginTop:10,background:'rgba(0,255,136,0.04)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:8,padding:'10px 14px' }}>
                <div style={{ fontSize:10,color:G,marginBottom:8,letterSpacing:1 }}>&#10003; PARSED {Object.keys(parsed).length} POSITIONS</div>
                <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                  {Object.entries(parsed).map(([ticker,data])=>(
                    <div key={ticker} style={{ fontSize:10,padding:'3px 8px',background:'rgba(255,255,255,0.05)',borderRadius:4,color:data.gainAmt>=0?G:R }}>
                      {ticker} {data.gainAmt>=0?'+':''}${Math.abs(data.gainAmt).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:'flex',gap:10,marginTop:16 }}>
              <button onClick={()=>setStep(1)} style={{ flex:1,padding:'10px',background:'transparent',border:'1px solid rgba(255,255,255,0.12)',borderRadius:6,color:DIM,cursor:'pointer',fontSize:11 }}>&#8592; Back</button>
              <button onClick={save} disabled={!pv||!ad} style={{ flex:2,padding:'10px',background:parsed?'rgba(0,255,136,0.15)':'rgba(184,74,255,0.2)',border:'1px solid '+(parsed?G:'#B84AFF'),borderRadius:6,color:parsed?G:'#B84AFF',cursor:'pointer',fontSize:11,fontWeight:700,letterSpacing:1 }}>
                {parsed ? 'SYNC ' + Object.keys(parsed).length + ' POSITIONS →' : 'SYNC WITHOUT POSITIONS →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}