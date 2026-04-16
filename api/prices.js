export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const symbols = url.searchParams.get('symbols') || 'AAPL';
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com/',
    'Origin': 'https://finance.yahoo.com',
  };

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Content-Type': 'application/json',
  };

  try {
    // Try v7 first
    const r = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange`,
      { headers }
    );
    
    if (r.ok) {
      const data = await r.json();
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }
    
    // Fallback to v8 chart for individual tickers
    const syms = symbols.split(',');
    const results = await Promise.all(syms.map(async (s) => {
      try {
        const cr = await fetch(
          `https://query2.finance.yahoo.com/v8/finance/chart/${s.trim()}?interval=1d&range=1d`,
          { headers }
        );
        const cd = await cr.json();
        const meta = cd.chart?.result?.[0]?.meta;
        if (meta) {
          return {
            symbol: s.trim(),
            regularMarketPrice: meta.regularMarketPrice,
            regularMarketChangePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100),
            regularMarketChange: meta.regularMarketPrice - meta.chartPreviousClose,
            chartPreviousClose: meta.chartPreviousClose,
          };
        }
      } catch(e) {}
      return null;
    }));
    
    const filtered = results.filter(Boolean);
    return new Response(JSON.stringify({
      quoteResponse: { result: filtered, error: null }
    }), { headers: corsHeaders });
    
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}