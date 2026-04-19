import { fetchCached } from "./client";

// Live prices come from /api/prices (Yahoo Finance proxy — already live on Vercel).
// Polygon key is used for options Greeks in Phase 2D.
const POLYGON_KEY = import.meta.env.VITE_POLYGON_KEY;

const MOCK_PRICES = {
  PNR:91.08, AWK:131.20, VLTO:92.36, GWRS:7.67, CDZI:5.32, GRC:61.25,
  IONQ:45.62, VRT:279.25, CCJ:119.90, OKLO:66.81, SOUN:8.08
};

function mockQuote(ticker) {
  return { ticker, price: MOCK_PRICES[ticker] ?? null, mock: true };
}

export async function getLastTrade(ticker) {
  return fetchCached('price:' + ticker, async () => {
    const res = await fetch('/api/prices?symbols=' + ticker);
    if (!res.ok) throw new Error('prices ' + res.status);
    const data = await res.json();
    const result = (data.quoteResponse?.result || [])[0];
    if (!result) throw new Error('no result for ' + ticker);
    return {
      ticker,
      price: result.regularMarketPrice,
      chgPct: result.regularMarketChangePercent,
      mock: false,
    };
  }, 30_000).catch(() => mockQuote(ticker));
}

export async function getQuotes(tickers) {
  // Batch fetch all tickers in one call to /api/prices
  try {
    return fetchCached('quotes:' + tickers.join(','), async () => {
      const res = await fetch('/api/prices?symbols=' + tickers.join(','));
      if (!res.ok) throw new Error('prices batch ' + res.status);
      const data = await res.json();
      const out = {};
      (data.quoteResponse?.result || []).forEach(r => {
        out[r.symbol] = { ticker: r.symbol, price: r.regularMarketPrice, chgPct: r.regularMarketChangePercent, mock: false };
      });
      // fill missing with mock
      tickers.forEach(t => { if (!out[t]) out[t] = mockQuote(t); });
      return out;
    }, 30_000);
  } catch(e) {
    const out = {};
    tickers.forEach(t => { out[t] = mockQuote(t); });
    return out;
  }
}

// Phase 2D: options Greeks via Polygon
export async function getOptionSnapshot(optionTicker) {
  if (!POLYGON_KEY) return null;
  try {
    const res = await fetch('https://api.polygon.io/v3/snapshot/options/' + optionTicker + '?apiKey=' + POLYGON_KEY);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results ?? null;
  } catch(e) { return null; }
}
