import { fetchCached } from "./client";

const API_KEY = import.meta.env.VITE_POLYGON_KEY;
const BASE = "https://api.polygon.io";

// Approximate last known prices — used only when API key is absent or all calls fail.
// Lets the UI render something meaningful on first install before Polygon is wired.
const MOCK_PRICES = {
  PNR:  91.08,
  AWK:  131.20,
  VLTO: 92.36,
  GWRS: 7.67,
  CDZI: 5.32,
  GRC:  61.25,
  IONQ: 45.62,
  VRT:  279.25,
  CCJ:  119.90,
  OKLO: 66.81,
  SOUN: 8.08
};

function mockQuote(ticker) {
  return { ticker, price: MOCK_PRICES[ticker] ?? null, mock: true };
}

export async function getLastTrade(ticker) {
  if (!API_KEY) return mockQuote(ticker);

  return fetchCached(`polygon:trade:${ticker}`, async () => {
    const res = await fetch(
      `${BASE}/v2/last/trade/${ticker}?apiKey=${API_KEY}`
    );
    if (!res.ok) throw new Error(`Polygon ${res.status} for ${ticker}`);
    const json = await res.json();
    return {
      ticker,
      price: json.results?.p ?? null,
      size: json.results?.s ?? null,
      timestamp: json.results?.t ?? null
    };
  }, 30_000);
}

/**
 * Fetch quotes for many tickers in parallel.
 * Failures fall back to mock data per-ticker rather than failing the whole batch.
 */
export async function getQuotes(tickers) {
  const results = await Promise.allSettled(tickers.map(getLastTrade));
  const out = {};
  results.forEach((r, i) => {
    out[tickers[i]] = r.status === "fulfilled" ? r.value : mockQuote(tickers[i]);
  });
  return out;
}
