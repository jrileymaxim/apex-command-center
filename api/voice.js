export const config = { runtime: 'edge' };

const PORTFOLIO = "AAL 12.70sh avg$11.30, SMCI 13.713sh avg$23.24, MNTS 40sh avg$5.84, ANET 2sh avg$143.29, TSM 5.8sh avg$372.13, MU 1.008sh avg$413.38, NVDA 3.9sh avg$188.64, VTI 3sh avg$338.75, CRWV 10.9sh avg$111.86, DVN 13sh avg$47.28, GLD 0.4sh avg$439.22, BBAI 50sh avg$3.56. SOUN LEAPS: $10C 1/15/27 at $1.24, $10C 1/21/28 at $2.38. 4 MLB parlays $112 stake $13,008.93 max payout settle Oct 31 2026.";
const MY_TICKERS = ["AAL","SMCI","MNTS","ANET","TSM","MU","NVDA","VTI","CRWV","DVN","GLD","BBAI","SOUN"];
const ALL_TICKERS = [...MY_TICKERS,"AAPL","MSFT","GOOGL","AMZN","META","TSLA","SPY","QQQ","BTC-USD","ETH-USD","AMD","INTC"];

const BASE_URL = "https://apex-command-center-mu.vercel.app";

async function fetchPrices(symbols) {
  try {
    // Use our own /api/prices proxy which already works
    const r = await fetch(BASE_URL + "/api/prices?symbols=" + symbols.join(","));
    const d = await r.json();
    return (d.quoteResponse?.result || []).map(q => ({
      symbol: q.symbol,
      price: (q.regularMarketPrice || 0).toFixed(2),
      change: (q.regularMarketChange || 0).toFixed(2),
      changePct: (q.regularMarketChangePercent || 0).toFixed(2)
    }));
  } catch(e) { return []; }
}

async function fetchWeather(city) {
  try {
    const geo = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(city) + "&count=1").then(r=>r.json());
    const loc = geo.results?.[0];
    if (!loc) return null;
    const wx = await fetch("https://api.open-meteo.com/v1/forecast?latitude=" + loc.latitude + "&longitude=" + loc.longitude + "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph").then(r=>r.json());
    const c = wx.current;
    const codes = {0:"clear skies",1:"mostly clear",2:"partly cloudy",3:"overcast",45:"foggy",51:"light drizzle",61:"light rain",71:"light snow",80:"rain showers",95:"thunderstorm"};
    const desc = codes[c.weather_code] || "mixed conditions";
    return loc.name + ": " + Math.round(c.temperature_2m) + "F, " + desc + ", humidity " + c.relative_humidity_2m + "%, wind " + Math.round(c.wind_speed_10m) + " mph";
  } catch(e) { return null; }
}

async function fetchSEC(ticker) {
  try {
    const CIKS = {AAL:"0000006201",SMCI:"0001375365",ANET:"0001313925",TSM:"0001046179",MU:"0000723254",NVDA:"0001045810",CRWV:"0001866175",DVN:"0000315189",MNTS:"0001801236",SOUN:"0001653519",BBAI:"0001835016"};
    const cik = CIKS[ticker.toUpperCase()];
    if (!cik) return null;
    const subs = await fetch("https://data.sec.gov/submissions/CIK" + cik + ".json",{headers:{"User-Agent":"apex/1.0 apex@app.com"}}).then(r=>r.json());
    const recent = subs.filings?.recent || {};
    const top = [];
    for (let i = 0; i < Math.min(3,(recent.form||[]).length); i++) {
      top.push(recent.form[i] + " on " + recent.filingDate[i]);
    }
    return ticker.toUpperCase() + " recent SEC filings: " + top.join(", ");
  } catch(e) { return null; }
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST","Access-Control-Allow-Headers":"Content-Type"}});
  try {
    const { question } = await req.json();
    const q = question.toLowerCase();
    let dataChunks = [];

    // ── PRICE intent ────────────────────────────────────────
    const mentionedTickers = ALL_TICKERS.filter(t => {
      const sym = t.toLowerCase().replace("-usd","");
      return q.includes(" " + sym + " ") || q.includes(" " + sym + "?") || q.includes(" " + sym + "'") || q.startsWith(sym + " ") || q.endsWith(" " + sym);
    });
    if (mentionedTickers.length > 0 || /price|stock|worth|trading|market cap|shares|portfolio|gain|loss|pnl|how.*doing|performance/i.test(q)) {
      const syms = mentionedTickers.length > 0 ? mentionedTickers : MY_TICKERS;
      const prices = await fetchPrices(syms);
      if (prices.length > 0) {
        dataChunks.push("LIVE PRICES: " + prices.map(p => p.symbol + " $" + p.price + " (" + (parseFloat(p.changePct) >= 0 ? "+" : "") + p.changePct + "%)").join(", "));
      }
    }

    // ── WEATHER intent ──────────────────────────────────────
    if (/weather|temperature|forecast|hot|cold|raining|sunny|humid/i.test(q)) {
      const cityMatch = q.match(/weather(?:\s+in)?\s+([a-z\s]{2,20})/) || q.match(/in\s+([a-z\s]{2,15})\s+weather/);
      const city = cityMatch ? cityMatch[1].trim() : "Phoenix, Arizona";
      const wx = await fetchWeather(city);
      if (wx) dataChunks.push("WEATHER: " + wx);
    }

    // ── SEC / INSIDER intent ────────────────────────────────
    if (/filing|insider|sec edgar|form 4|8-k|disclosure/i.test(q)) {
      const tickerInQ = ALL_TICKERS.find(t => q.includes(t.toLowerCase()));
      if (tickerInQ) {
        const sec = await fetchSEC(tickerInQ);
        if (sec) dataChunks.push(sec);
      }
    }

    // ── NEWS intent — Yahoo RSS ─────────────────────────────
    if (/news|headline|what.*happening|latest|update|today/i.test(q)) {
      try {
        const topic = mentionedTickers.length > 0 ? mentionedTickers[0] : "stock+market";
        const rss = await fetch("https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + topic + "&region=US&lang=en-US",{headers:{"User-Agent":"apex/1.0"}}).then(r=>r.text());
        const titles = [];
        let match; const re = /<title><![CDATA[(.+?)]]></title>/g;
        while ((match = re.exec(rss)) !== null && titles.length < 4) { if (!match[1].includes("Yahoo")) titles.push(match[1]); }
        if (titles.length > 0) dataChunks.push("RECENT NEWS: " + titles.join(" | "));
      } catch(e) {}
    }

    // ── TIME / DATE intent ──────────────────────────────────
    if (/time|date|what day|today.*date|clock/i.test(q)) {
      const now = new Date().toLocaleString("en-US",{timeZone:"America/Phoenix",weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
      dataChunks.push("CURRENT TIME (Phoenix AZ): " + now);
    }

    // ── BUILD PROMPT ────────────────────────────────────────
    const isFinance = /stock|position|portfolio|price|buy|sell|hold|market|invest|soun|nvda|mu|tsm|parlay|leap|option|sector|earnings|gain|loss|pnl/i.test(q);
    let system = "You are Marcus, a sharp personal AI assistant." + (isFinance ? " User portfolio: " + PORTFOLIO : "") + " Answer directly in 2-3 sentences using actual numbers from the live data provided. No disclaimers.";
    if (dataChunks.length > 0) system += "\n\nLIVE DATA:\n" + dataChunks.join("\n");

    const resp = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY||"","anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:350,system,messages:[{role:"user",content:question}]})
    });
    const data = await resp.json();
    const answer = data.content?.[0]?.text || "Could not get answer.";
    return new Response(JSON.stringify({answer,dataFetched:dataChunks}),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  } catch(e) {
    return new Response(JSON.stringify({answer:"Error: "+e.message,dataFetched:[]}),{status:500,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
}