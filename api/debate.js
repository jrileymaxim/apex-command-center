export const config = { runtime: 'edge' };
const CORS = {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

async function researchSide(ticker, side) {
  const prompt = side === 'bull'
    ? 'You are a bullish equity analyst. Research ' + ticker + ' right now using web search. Find: recent earnings beats, analyst upgrades, positive catalysts, revenue growth, market tailwinds, and any compelling reasons the stock could rise significantly. Be specific with real numbers, dates, and sources. Write 3-4 sentences of sharp, data-driven bull thesis. No generic statements.'
    : 'You are a bearish equity analyst. Research ' + ticker + ' right now using web search. Find: risks, analyst downgrades, competition threats, valuation concerns, insider selling, negative catalysts, and any compelling reasons the stock could fall. Be specific with real numbers, dates, and sources. Write 3-4 sentences of sharp, data-driven bear thesis. No generic statements.';

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'interleaved-thinking-2025-05-14'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const d = await r.json();
  const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  return text || 'Analysis unavailable.';
}

export default async function handler(req) {
  const url = new URL(req.url);
  const ticker = url.searchParams.get('ticker');
  if (!ticker) return new Response(JSON.stringify({error:'ticker required'}), {status:400, headers:CORS});

  const [bull, bear] = await Promise.all([
    researchSide(ticker, 'bull'),
    researchSide(ticker, 'bear'),
  ]);
  return new Response(JSON.stringify({ ticker, bull, bear, ts: new Date().toISOString() }), { headers: CORS });
}