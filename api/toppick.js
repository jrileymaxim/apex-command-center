export const config = { runtime: 'edge' };
const CORS = {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

// Cache in edge KV if available — otherwise regenerate
let cached = null;
let cachedAt = 0;
const CACHE_MS = 4 * 3600 * 1000; // 4 hours

export default async function handler(req) {
  if (cached && Date.now() - cachedAt < CACHE_MS) {
    return new Response(JSON.stringify(cached), { headers: CORS });
  }

  const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});

  const prompt = `Today is ${today}. You are a professional stock analyst specializing in finding hidden gems before they break out.

Search the web RIGHT NOW for:
1. Small/mid cap stocks (under $10B market cap) with unusual bullish options flow today or this week
2. Stocks with a major catalyst nobody is talking about yet (FDA decision, contract win, earnings beat, partnership)
3. Stocks near a technical breakout with strong fundamentals
4. Any company reporting earnings soon that could beat estimates significantly

Pick ONE ticker that has the highest probability of a significant move up in the next 2-4 weeks.

Return ONLY a JSON object (no markdown, no explanation outside the JSON):
{
  "ticker": "XXXX",
  "name": "Company Name",
  "price": "$XX.XX",
  "marketCap": "$XB",
  "catalyst": "One sentence describing the specific catalyst",
  "thesis": "2-3 sentences with specific data points, numbers, and dates explaining why this stock is about to move",
  "risk": "One sentence on the main risk",
  "timeframe": "X-X weeks",
  "conviction": "HIGH|MEDIUM",
  "sources": ["source1", "source2"]
}`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const d = await r.json();
  const text = (d.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
  
  try {
    const clean = text.replace(/```json|```/g,'').trim();
    const pick = JSON.parse(clean);
    pick.generatedAt = new Date().toISOString();
    cached = pick;
    cachedAt = Date.now();
    return new Response(JSON.stringify(pick), { headers: CORS });
  } catch(e) {
    return new Response(JSON.stringify({ error: 'parse failed', raw: text.slice(0,200) }), { status:500, headers:CORS });
  }
}