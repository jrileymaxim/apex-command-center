export const config = { runtime: 'edge' };

const PORTFOLIO = "AAL 12.70sh avg$11.30, SMCI 13.713sh avg$23.24, MNTS 40sh avg$5.84, ANET 2sh avg$143.29, TSM 5.8sh avg$372.13, MU 1.008sh avg$413.38, NVDA 3.9sh avg$188.64, VTI 3sh avg$338.75, CRWV 10.9sh avg$111.86, DVN 13sh avg$47.28, GLD 0.4sh avg$439.22, BBAI 50sh avg$3.56. SOUN LEAPS: 10C 1/15/27 at $1.24, 10C 1/21/28 at $2.38. 4 MLB parlays $112 stake $13,008.93 max payout settle Oct 31 2026.";
const TICKERS = ["AAL","SMCI","MNTS","ANET","TSM","MU","NVDA","VTI","CRWV","DVN","GLD","BBAI","SOUN","AAPL","MSFT","GOOGL","AMZN","META","TSLA","SPY","QQQ","BTC-USD","ETH-USD"];

async function fetchPrices(symbols) {
  try {
    const url = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=" + symbols.join(",") + "&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange";
    const r = await fetch(url, {headers:{"User-Agent":"Mozilla/5.0"}});
    const d = await r.json();
    return (d.quoteResponse?.result || []).map(q => ({
      symbol: q.symbol,
      price: q.regularMarketPrice?.toFixed(2),
      change: (q.regularMarketChange || 0).toFixed(2),
      changePct: (q.regularMarketChangePercent || 0).toFixed(2)
    }));
  } catch(e) { return []; }
}

async function fetchWeather(city) {
  try {
    // Geocode
    const geo = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(city) + "&count=1").then(r=>r.json());
    const loc = geo.results?.[0];
    if (!loc) return null;
    const wx = await fetch("https://api.open-meteo.com/v1/forecast?latitude=" + loc.latitude + "&longitude=" + loc.longitude + "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph").then(r=>r.json());
    const c = wx.current;
    const codes = {0:"clear",1:"mostly clear",2:"partly cloudy",3:"overcast",45:"foggy",51:"light drizzle",61:"light rain",71:"light snow",80:"rain showers",95:"thunderstorm"};
    const desc = codes[c.weather_code] || "mixed conditions";
    return loc.name + ": " + Math.round(c.temperature_2m) + "°F, " + desc + ", humidity " + c.relative_humidity_2m + "%, wind " + Math.round(c.wind_speed_10m) + " mph";
  } catch(e) { return null; }
}

async function fetchNews(query) {
  try {
    const r = await fetch("https://api.marketaux.com/v1/news/all?search=" + encodeURIComponent(query) + "&limit=3&api_token=demo", {headers:{"User-Agent":"apex/1.0"}});
    const d = await r.json();
    if (d.data?.length) return d.data.slice(0,3).map(a => a.title).join("; ");
    return null;
  } catch(e) { return null; }
}

async function fetchSEC(ticker) {
  try {
    const CIKS = {AAL:"0000006201",SMCI:"0001375365",ANET:"0001313925",TSM:"0001046179",MU:"0000723254",NVDA:"0001045810",CRWV:"0001866175",DVN:"0000315189",MNTS:"0001801236",SOUN:"0001653519",BBAI:"0001835016"};
    const cik = CIKS[ticker.toUpperCase()];
    if (!cik) return null;
    const subs = await fetch("https://data.sec.gov/submissions/CIK" + cik + ".json", {headers:{"User-Agent":"apex/1.0 apex@app.com"}}).then(r=>r.json());
    const recent = subs.filings?.recent || {};
    const top = [];
    for (let i = 0; i < Math.min(3, (recent.form||[]).length); i++) {
      top.push(recent.form[i] + " on " + recent.filingDate[i]);
    }
    return ticker.toUpperCase() + " recent SEC filings: " + top.join(", ");
  } catch(e) { return null; }
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, {headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST","Access-Control-Allow-Headers":"Content-Type"}});
  try {
    const { question } = await req.json();
    const q = question.toLowerCase();
    let dataChunks = [];

    // ── Detect intent and fetch relevant data ──────────────────

    // PRICE intent — detect ticker mentions or "price/stock/how much/worth"
    const mentionedTickers = TICKERS.filter(t => q.includes(t.toLowerCase()) || q.includes(t.toLowerCase().replace("-usd","")));
    if (mentionedTickers.length > 0 || /price|stock|worth|cost|trading|market|shares|position|portfolio|gain|loss|pnl|up|down|percent/i.test(q)) {
      const symsToFetch = mentionedTickers.length > 0 ? mentionedTickers : ["AAL","SMCI","MNTS","ANET","TSM","MU","NVDA","CRWV","DVN","GLD","BBAI","SOUN"];
      const prices = await fetchPrices(symsToFetch);
      if (prices.length > 0) {
        dataChunks.push("LIVE PRICES: " + prices.map(p => p.symbol + " $" + p.price + " (" + (p.changePct > 0 ? "+" : "") + p.changePct + "%)").join(", "));
      }
    }

    // WEATHER intent
    const weatherMatch = q.match(/weather(?:\s+in)?\s+([a-z\s]+?)(?:\?|$|today|now|like|forecast)/i) || (q.includes("weather") ? ["","Phoenix"] : null);
    if (weatherMatch) {
      const city = (weatherMatch[1]?.trim() || "Phoenix").replace(/\?/g,"");
      const wx = await fetchWeather(city || "Phoenix");
      if (wx) dataChunks.push("WEATHER: " + wx);
    }

    // SEC / INSIDER intent
    const secMatch = q.match(/filing|insider|sec|form 4|8-k/i);
    if (secMatch) {
      const tickerInQ = TICKERS.find(t => q.includes(t.toLowerCase()));
      if (tickerInQ) {
        const sec = await fetchSEC(tickerInQ);
        if (sec) dataChunks.push("SEC DATA: " + sec);
      }
    }

    // NEWS intent — use title-only from public RSS via allorigins
    if (/news|headline|happening|today|latest|market update|what.*going on/i.test(q)) {
      try {
        const rssTopic = mentionedTickers.length > 0 ? mentionedTickers[0] : "stock market";
        const rssUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + rssTopic + "&region=US&lang=en-US");
        const rssResp = await fetch(rssUrl).then(r=>r.json());
        const titles = [...(rssResp.contents||"").matchAll(/<title><![CDATA[(.*?)]]><\/title>/g)].slice(1,4).map(m=>m[1]);
        if (titles.length > 0) dataChunks.push("RECENT NEWS: " + titles.join(" | "));
      } catch(e) {}
    }

    // TIME / DATE intent
    if (/time|date|day|what.*day|clock/i.test(q)) {
      const now = new Date().toLocaleString("en-US", {timeZone:"America/Phoenix",weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
      dataChunks.push("CURRENT TIME (Phoenix AZ): " + now);
    }

    // Build final prompt
    const isFinance = /stock|position|portfolio|price|buy|sell|hold|market|invest|soun|nvda|mu|tsm|parlay|leap|option|sector|earnings|gain|loss/i.test(q);
    let systemPrompt = "You are Marcus, a sharp personal AI assistant. " + (isFinance ? "The user's portfolio: " + PORTFOLIO + " " : "") + "You have been given live data to answer accurately. Answer directly in 2-3 sentences. Be specific — use the actual numbers. No disclaimers.";
    if (dataChunks.length > 0) systemPrompt += "\n\nLIVE DATA FETCHED:\n" + dataChunks.join("\n");

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY||"","anthropic-version":"2023-06-01"},
      body: JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:350,system:systemPrompt,messages:[{role:"user",content:question}]})
    });
    const data = await resp.json();
    const answer = data.content?.[0]?.text || "I could not get an answer.";
    return new Response(JSON.stringify({answer, dataFetched: dataChunks}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  } catch(e) {
    return new Response(JSON.stringify({answer:"Error: " + e.message, dataFetched:[]}), {status:500,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
}