export const config = { runtime: 'edge' };

const CIKS = {
  AAL:'0000006201',SMCI:'0001375365',ANET:'0001313925',TSM:'0001046179',
  MU:'0000723254',NVDA:'0001045810',CRWV:'0001866175',DVN:'0000315189',
  MNTS:'0001801236',SOUN:'0001653519',BBAI:'0001836935',PNR:'0000077360',
  AWK:'0001410636',VLTO:'0001957189',GWRS:'0001410172',CDZI:'0000727510',
  GRC:'0000042682',XYL:'0001524472',VTI:'0000884203',GLD:'0001222333',
};

const CORS = {'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};

async function getInsiderActivity(ticker, cik) {
  try {
    const r = await fetch('https://data.sec.gov/submissions/CIK'+cik+'.json',{
      headers:{'User-Agent':'apex-command-center contact@apex.app'}
    });
    if (!r.ok) return null;
    const d = await r.json();
    const recent = d.filings?.recent || {};
    const forms = recent.form || [];
    const dates = recent.filingDate || [];
    const cutoff = new Date(Date.now() - 60*24*3600*1000).toISOString().slice(0,10);
    
    let bought = false, sold = false, lastBuyDate = null, lastSellDate = null;
    let buyerName = '', sellerName = '';
    
    for (let i = 0; i < forms.length; i++) {
      if (forms[i] !== '4') continue;
      if (dates[i] < cutoff) break;
      
      // Fetch the filing index to get XML
      try {
        const acc = recent.accessionNumber[i].replace(/-/g,'');
        const idx = await fetch('https://data.sec.gov/Archives/edgar/full-index/'+dates[i].slice(0,4)+'/QTR'+Math.ceil(parseInt(dates[i].slice(5,7))/3)+'/company.idx');
        // Use submissions data directly — check transactionType
        const fname = recent.primaryDocument?.[i] || '';
        if (fname.endsWith('.xml')) {
          const xmlUrl = 'https://www.sec.gov/Archives/edgar/data/'+parseInt(cik)+'/'+acc+'/'+fname;
          const xr = await fetch(xmlUrl, {headers:{'User-Agent':'apex-command-center contact@apex.app'}});
          const xml = await xr.text();
          const isBuy = xml.includes('<transactionCode>P</transactionCode>') || xml.includes('<transactionCode>A</transactionCode>');
          const isSell = xml.includes('<transactionCode>S</transactionCode>') || xml.includes('<transactionCode>D</transactionCode>');
          const nameMatch = xml.match(/<rptOwnerName>([^<]+)<\/rptOwnerName>/);
          const name = nameMatch ? nameMatch[1].trim() : 'Insider';
          if (isBuy) { bought = true; lastBuyDate = dates[i]; buyerName = name; }
          if (isSell) { sold = true; lastSellDate = dates[i]; sellerName = name; }
        }
      } catch(e) {}
    }
    return { ticker, bought, sold, lastBuyDate, lastSellDate, buyerName, sellerName };
  } catch(e) { return null; }
}

export default async function handler(req) {
  const tickers = Object.keys(CIKS);
  const results = await Promise.allSettled(
    tickers.map(t => getInsiderActivity(t, CIKS[t]))
  );
  const out = {};
  results.forEach((r,i) => {
    if (r.status === 'fulfilled' && r.value) out[tickers[i]] = r.value;
  });
  return new Response(JSON.stringify(out), { headers: CORS });
}