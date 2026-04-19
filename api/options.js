export const config = { runtime: 'edge' };

const LEAPS = [
  { label: 'SOUN $10C 1/15/27', strike: 10, expiry: '2027-01-15', contracts: 1, avgCost: 1.24, iv: 0.84 },
  { label: 'SOUN $10C 1/21/28', strike: 10, expiry: '2028-01-21', contracts: 1, avgCost: 2.38, iv: 0.83 },
];

const SCENARIOS = [7.04, 8.08, 10.00, 11.24, 12.38, 15.00, 20.00];
const R = 0.053;

function N(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return x >= 0 ? 1 - p : p;
}
function Npdf(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }

function bs(S, K, T, r, v) {
  if (T <= 0) return { price: Math.max(0, S - K), delta: S > K ? 1 : 0, gamma: 0, theta: 0, vega: 0 };
  const d1 = (Math.log(S / K) + (r + v * v / 2) * T) / (v * Math.sqrt(T));
  const d2 = d1 - v * Math.sqrt(T);
  return {
    price: S * N(d1) - K * Math.exp(-r * T) * N(d2),
    delta: N(d1),
    gamma: Npdf(d1) / (S * v * Math.sqrt(T)),
    theta: (-(S * Npdf(d1) * v) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * N(d2)) / 365,
    vega: S * Npdf(d1) * Math.sqrt(T) / 100,
  };
}

export default async function handler(req) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  try {
    let spot = 8.08;
    try {
      const pr = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/SOUN?interval=1d&range=1d');
      const pj = await pr.json();
      const mp = pj?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (mp) spot = mp;
    } catch(e) {}

    const now = new Date();
    const leapsData = LEAPS.map(l => {
      const expDate = new Date(l.expiry);
      const T = Math.max(0, (expDate - now) / (365 * 24 * 3600 * 1000));
      const days = Math.ceil((expDate - now) / (24 * 3600 * 1000));
      const g = bs(spot, l.strike, T, R, l.iv);
      const premium = g.price * 100 * l.contracts;
      const cost = l.avgCost * 100 * l.contracts;
      const pnl = premium - cost;
      const scenarios = SCENARIOS.map(s => {
        const sg = bs(s, l.strike, T, R, l.iv);
        const val = sg.price * 100 * l.contracts;
        return { spot: s, value: val, pnl: val - cost, pnlPct: cost > 0 ? ((val - cost) / cost) * 100 : 0 };
      });
      return {
        ...l, spot, days, T,
        price: g.price, premium, cost, pnl,
        pnlPct: cost > 0 ? (pnl / cost) * 100 : 0,
        delta: g.delta, gamma: g.gamma, theta: g.theta, vega: g.vega,
        dailyTheta: g.theta * 100 * l.contracts,
        weeklyTheta: g.theta * 100 * l.contracts * 5,
        breakeven: Math.round((l.strike + l.avgCost) * 100) / 100,
        breakevenGapPct: ((l.strike + l.avgCost - spot) / spot) * 100,
        intrinsic: Math.max(0, spot - l.strike),
        timeValue: Math.max(0, g.price - Math.max(0, spot - l.strike)),
        scenarios,
      };
    });

    const combined = {
      totalCost: leapsData.reduce((a, l) => a + l.cost, 0),
      totalPremium: leapsData.reduce((a, l) => a + l.premium, 0),
      totalPnl: leapsData.reduce((a, l) => a + l.pnl, 0),
      combinedDelta: leapsData.reduce((a, l) => a + l.delta * l.contracts, 0),
      combinedGamma: leapsData.reduce((a, l) => a + l.gamma * l.contracts, 0),
      dailyThetaTotal: leapsData.reduce((a, l) => a + l.dailyTheta, 0),
    };

    return new Response(JSON.stringify({ leaps: leapsData, combined, spot, source: 'bs-model' }), { headers: cors });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
}
