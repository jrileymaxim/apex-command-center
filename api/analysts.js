export const config = { runtime: 'edge' };

const FINNHUB_KEY = process.env.FINNHUB_KEY || '';

// Manually curated consensus targets (updated Apr 2026)
// Source: Wall Street consensus as of most recent quarter
const SEED_TARGETS = {
  PNR:  { low: 85,  mean: 112, high: 135, count: 12, rating: 'Buy' },
  AWK:  { low: 115, mean: 142, high: 165, count: 18, rating: 'Buy' },
  VLTO: { low: 78,  mean: 105, high: 128, count: 14, rating: 'Buy' },
  GWRS: { low: 6,   mean: 10,  high: 14,  count: 5,  rating: 'Hold' },
  CDZI: { low: 4,   mean: 7,   high: 10,  count: 4,  rating: 'Buy' },
  GRC:  { low: 52,  mean: 72,  high: 88,  count: 8,  rating: 'Buy' },
  SOUN: { low: 6,   mean: 12,  high: 20,  count: 9,  rating: 'Buy' },
};

const TICKERS = Object.keys(SEED_TARGETS);

async function finnhubTarget(ticker) {
  const r = await fetch(
    `https://finnhub.io/api/v1/stock/price-target?symbol=${ticker}&token=${FINNHUB_KEY}`,
    { headers: { 'X-Finnhub-Token': FINNHUB_KEY } }
  );
  if (!r.ok) throw new Error(r.status);
  const d = await r.json();
  if (!d.targetMean) throw new Error('no data');
  return {
    low: d.targetLow, mean: d.targetMean, high: d.targetHigh,
    count: d.numberOfAnalysts, rating: null, live: true
  };
}

export default async function handler(req) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const results = {};
  for (const ticker of TICKERS) {
    try {
      if (FINNHUB_KEY) {
        results[ticker] = await finnhubTarget(ticker);
      } else {
        results[ticker] = { ...SEED_TARGETS[ticker], live: false };
      }
    } catch(e) {
      results[ticker] = { ...SEED_TARGETS[ticker], live: false };
    }
  }
  return new Response(JSON.stringify({ targets: results, source: FINNHUB_KEY ? 'finnhub' : 'seed' }), { headers: cors });
}