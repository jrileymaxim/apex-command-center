export const config = { runtime: 'edge' };

const FINNHUB_KEY = process.env.FINNHUB_KEY || '';
const SEED_CATALYSTS = [
  { ticker:'GRC',  date:'2026-04-23', type:'earnings', importance:3, notes:'Q1 2026 earnings' },
  { ticker:'VLTO', date:'2026-04-29', type:'earnings', importance:4, notes:'Q1 2026 earnings' },
  { ticker:'AWK',  date:'2026-05-06', type:'earnings', importance:4, notes:'Q1 2026 earnings' },
  { ticker:'SOUN', date:'2026-05-07', type:'earnings', importance:5, notes:'Q1 2026 earnings — LEAPS exposure' },
  { ticker:'OKLO', date:'2026-05-19', type:'earnings', importance:3, notes:'Q1 2026 earnings' },
];

const TICKERS = ['PNR','AWK','VLTO','GWRS','CDZI','GRC','IONQ','VRT','CCJ','OKLO','SOUN'];

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'GET',
    'Content-Type':'application/json',
  };

  try {
    if (!FINNHUB_KEY) throw new Error('no key');

    const today = new Date().toISOString().slice(0,10);
    const to = new Date(Date.now() + 90*864e5).toISOString().slice(0,10);
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${today}&to=${to}&token=${FINNHUB_KEY}`;

    const res = await fetch(url, { headers: { 'X-Finnhub-Token': FINNHUB_KEY } });
    if (!res.ok) throw new Error('finnhub ' + res.status);

    const data = await res.json();
    const tickerSet = new Set(TICKERS);
    const live = (data.earningsCalendar || [])
      .filter(e => tickerSet.has(e.symbol))
      .map(e => ({
        ticker: e.symbol,
        date: e.date,
        type: 'earnings',
        importance: e.symbol === 'SOUN' ? 5 : 3,
        notes: (e.epsEstimate != null ? 'EPS est: ' + e.epsEstimate : '') +
               (e.revenueEstimate != null ? '  Rev est: $' + (e.revenueEstimate/1e6).toFixed(0) + 'M' : ''),
        live: true,
      }));

    // Merge: live data wins, seed fills gaps
    const merged = [...live];
    const liveSet = new Set(live.map(e => e.ticker));
    SEED_CATALYSTS.forEach(s => { if (!liveSet.has(s.ticker)) merged.push(s); });
    merged.sort((a,b) => a.date.localeCompare(b.date));

    return new Response(JSON.stringify({ catalysts: merged, source: 'finnhub' }), { headers: cors });
  } catch(e) {
    return new Response(JSON.stringify({ catalysts: SEED_CATALYSTS, source: 'seed', error: e.message }), { headers: cors });
  }
}
