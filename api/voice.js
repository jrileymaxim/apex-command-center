export const config = { runtime: 'edge' };

const PORTFOLIO = 'AAL 12.70sh avg$11.30, SMCI 13.713sh avg$23.24, MNTS 40sh avg$5.84, ANET 2sh avg$143.29, TSM 5.8sh avg$372.13, MU 1.008sh avg$413.38, NVDA 3.9sh avg$188.64, VTI 3sh avg$338.75, CRWV 10.9sh avg$111.86, DVN 13sh avg$47.28, GLD 0.4sh avg$439.22, BBAI 50sh avg$3.56. SOUN LEAPS: $10C 1/15/27 at $1.24, $10C 1/21/28 at $2.38. 4 MLB parlays $112 stake $13,008.93 max payout settle Oct 31 2026.';
const MY_TICKERS = ['AAL','SMCI','MNTS','ANET','TSM','MU','NVDA','VTI','CRWV','DVN','GLD','BBAI','SOUN'];
const ALL_TICKERS = ['AAL','SMCI','MNTS','ANET','TSM','MU','NVDA','VTI','CRWV','DVN','GLD','BBAI','SOUN','AAPL','MSFT','GOOGL','AMZN','META','TSLA','SPY','QQQ','AMD','INTC','BTC-USD','ETH-USD'];
const BASE = 'https://apex-command-center-mu.vercel.app';

async function getPrices(syms) {
  try {
    const r = await fetch(BASE + '/api/prices?symbols=' + syms.join(','));
    const d = await r.json();
    return (d.quoteResponse && d.quoteResponse.result || []).map(q => ({
      s: q.symbol,
      p: (q.regularMarketPrice || 0).toFixed(2),
      c: (q.regularMarketChangePercent || 0).toFixed(2)
    }));
  } catch(e) { return []; }
}

async function getWeather(city) {
  try {
    const geo = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(city) + '&count=1').then(r=>r.json());
    const loc = geo.results && geo.results[0];
    if (!loc) return null;
    const wx = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + loc.latitude + '&longitude=' + loc.longitude + '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph').then(r=>r.json());
    const c = wx.current;
    const codes = {0:'clear',1:'mostly clear',2:'partly cloudy',3:'overcast',45:'foggy',51:'light drizzle',61:'light rain',71:'light snow',80:'rain showers',95:'thunderstorm'};
    return loc.name + ': ' + Math.round(c.temperature_2m) + 'F, ' + (codes[c.weather_code] || 'mixed') + ', humidity ' + c.relative_humidity_2m + '%, wind ' + Math.round(c.wind_speed_10m) + ' mph';
  } catch(e) { return null; }
}

async function getSEC(ticker) {
  try {
    const CIKS = {AAL:'0000006201',SMCI:'0001375365',ANET:'0001313925',TSM:'0001046179',MU:'0000723254',NVDA:'0001045810',CRWV:'0001866175',DVN:'0000315189',MNTS:'0001801236',SOUN:'0001653519',BBAI:'0001835016'};
    const cik = CIKS[ticker.toUpperCase()];
    if (!cik) return null;
    const subs = await fetch('https://data.sec.gov/submissions/CIK' + cik + '.json', {headers:{'User-Agent':'apex/1.0 apex@app.com'}}).then(r=>r.json());
    const f = subs.filings && subs.filings.recent || {};
    const top = [];
    for (let i = 0; i < Math.min(3, (f.form||[]).length); i++) top.push(f.form[i] + ' on ' + f.filingDate[i]);
    return ticker.toUpperCase() + ' recent filings: ' + top.join(', ');
  } catch(e) { return null; }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, {headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'}});
  try {
    const body = await req.json();
    const question = body.question || '';
    const q = question.toLowerCase();
    const data = [];

    // Price detection
    const hits = ALL_TICKERS.filter(t => q.includes(t.toLowerCase().replace('-usd','')));
    if (hits.length > 0 || /price|stock|worth|trading|portfolio|gain|loss|position|performance/.test(q)) {
      const syms = hits.length > 0 ? hits : MY_TICKERS;
      const prices = await getPrices(syms);
      if (prices.length) data.push('LIVE PRICES: ' + prices.map(p => p.s + ' $' + p.p + ' (' + (parseFloat(p.c) >= 0 ? '+' : '') + p.c + '%)').join(', '));
    }

    // Weather detection
    if (/weather|temperature|forecast|hot|cold|sunny|raining/.test(q)) {
      const m = q.match(/weather in ([a-z ]{2,20})/);
      const city = m ? m[1].trim() : 'Phoenix';
      const wx = await getWeather(city);
      if (wx) data.push('WEATHER: ' + wx);
    }

    // SEC detection
    if (/filing|insider|sec|form 4|8-k/.test(q)) {
      const t = ALL_TICKERS.find(t => q.includes(t.toLowerCase()));
      if (t) { const s = await getSEC(t); if (s) data.push(s); }
    }

    // Time detection
    if (/time|date|what day|today/.test(q)) {
      data.push('CURRENT TIME (Phoenix AZ): ' + new Date().toLocaleString('en-US', {timeZone:'America/Phoenix',weekday:'long',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}));
    }

    // Build prompt
    const isFinance = /stock|portfolio|price|buy|sell|hold|invest|soun|nvda|mu|tsm|parlay|leap|earnings|gain|loss/.test(q);
    let system = 'You are Marcus, a sharp personal AI assistant.' + (isFinance ? ' User portfolio: ' + PORTFOLIO : '') + ' Answer in 2-3 direct sentences using the exact numbers from live data. No disclaimers.';
    if (data.length > 0) system += '\n\nLIVE DATA:\n' + data.join('\n');

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY||'','anthropic-version':'2023-06-01'},
      body: JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:350,system,messages:[{role:'user',content:question}]})
    });
    const out = await resp.json();
    const answer = (out.content && out.content[0] && out.content[0].text) || 'Could not get answer.';
    return new Response(JSON.stringify({answer, dataFetched: data}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  } catch(e) {
    return new Response(JSON.stringify({answer:'Error: '+e.message, dataFetched:[]}), {status:500,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }
}