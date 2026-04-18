export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, {headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'}});
  try {
    const { cik, acc, xmlFile } = await req.json();
    if (!cik || !acc || !xmlFile) return new Response(JSON.stringify({txDir:null,error:'missing params'}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    const accFmt = acc.replace(/-/g,'');
    const url = 'https://www.sec.gov/Archives/edgar/data/' + cik + '/' + accFmt + '/' + xmlFile;
    const resp = await fetch(url, {headers:{'User-Agent':'apex/1.0 apex@app.com'}});
    if (!resp.ok) return new Response(JSON.stringify({txDir:null,error:'fetch '+resp.status}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    const xml = await resp.text();
    const codes = [...xml.matchAll(/<transactionCode>([^<]+)<\/transactionCode>/g)].map(m=>m[1].trim());
    const hasBuy = codes.some(c=>c==='P'||c==='A');
    const hasSell = codes.some(c=>c==='S'||c==='D');
    const txDir = hasBuy && !hasSell ? 'BUY' : hasSell && !hasBuy ? 'SELL' : codes.length > 0 ? 'MIXED' : null;
    return new Response(JSON.stringify({txDir}),{headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  } catch(e) {
    return new Response(JSON.stringify({txDir:null,error:e.message}),{status:500,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }
}