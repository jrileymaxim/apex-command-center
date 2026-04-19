export const config = { runtime: 'edge' };
const FINNHUB_KEY = process.env.FINNHUB_KEY || '';
const SEED_TARGETS = {
  PNR:  { low:85,   mean:112,  high:135,  count:12, rating:'Buy' },
  AWK:  { low:115,  mean:142,  high:165,  count:18, rating:'Buy' },
  VLTO: { low:78,   mean:105,  high:128,  count:14, rating:'Buy' },
  GWRS: { low:6,    mean:10,   high:14,   count:5,  rating:'Hold' },
  CDZI: { low:4,    mean:7,    high:10,   count:4,  rating:'Buy' },
  GRC:  { low:52,   mean:72,   high:88,   count:8,  rating:'Buy' },
  NVDA: { low:130,  mean:165,  high:220,  count:42, rating:'Buy' },
  ANET: { low:82,   mean:118,  high:155,  count:22, rating:'Buy' },
  MU:   { low:80,   mean:128,  high:175,  count:38, rating:'Buy' },
  SMCI: { low:18,   mean:32,   high:55,   count:10, rating:'Hold' },
  CRWV: { low:95,   mean:145,  high:200,  count:8,  rating:'Buy' },
  TSM:  { low:155,  mean:230,  high:295,  count:28, rating:'Buy' },
  VTI:  { low:null, mean:null,  high:null, count:0,  rating:'ETF' },
  GLD:  { low:null, mean:null,  high:null, count:0,  rating:'ETF' },
  DVN:  { low:32,   mean:46,   high:62,   count:26, rating:'Buy' },
  BBAI: { low:2,    mean:4.5,  high:8,    count:6,  rating:'Buy' },
  MNTS: { low:1.5,  mean:3.5,  high:7,    count:3,  rating:'Hold' },
  AAL:  { low:8,    mean:13,   high:18,   count:18, rating:'Hold' },
  SOUN: { low:6,    mean:12,   high:20,   count:9,  rating:'Buy' },
};
const TICKERS = Object.keys(SEED_TARGETS).filter(t => SEED_TARGETS[t].mean);
async function finnhubTarget(ticker) {
  const r = await fetch(`https://finnhub.io/api/v1/stock/price-target?symbol=${ticker}&token=${FINNHUB_KEY}`, { headers: { 'X-Finnhub-Token': FINNHUB_KEY } });
  if (!r.ok) throw new Error(r.status);
  const d = await r.json();
  if (!d.targetMean) throw new Error('no data');
  return { low: d.targetLow, mean: d.targetMean, high: d.targetHigh, count: d.numberOfAnalysts, rating: null, live: true };
}
export default async function handler(req) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const results = {};
  for (const ticker of TICKERS) {
    try {
      results[ticker] = FINNHUB_KEY ? await finnhubTarget(ticker) : { ...SEED_TARGETS[ticker], live: false };
    } catch(e) { results[ticker] = { ...SEED_TARGETS[ticker], live: false }; }
  }
  return new Response(JSON.stringify({ targets: results, source: FINNHUB_KEY ? 'finnhub' : 'seed' }), { headers: cors });
}