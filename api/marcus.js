export const config = { runtime: 'edge' };

const CIKS = {
  AAL:"0000006201", SMCI:"0001375365", ANET:"0001313925", TSM:"0001046179",
  MU:"0000723254", NVDA:"0001045810", CRWV:"0001866175", DVN:"0000315189",
  MNTS:"0001801236", SOUN:"0001653519", BBAI:"0001835016"
};

async function fetchFilingData(ticker, form) {
  const cik = CIKS[ticker];
  if (!cik) return "";
  try {
    const atom = await fetch(
      `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${encodeURIComponent(form)}&dateb=&owner=include&count=1&search_text=&output=atom`,
      { headers: { "User-Agent": "apex/1.0 apex@app.com" } }
    ).then(r => r.text()).catch(() => "");

    if (form === "4") {
      const xmlMatch = atom.match(/href="(\/Archives\/edgar\/data\/[^"]+\.xml)"/i);
      if (!xmlMatch) return "";
      const xml = await fetch("https://www.sec.gov" + xmlMatch[1], {
        headers: { "User-Agent": "apex/1.0 apex@app.com" }
      }).then(r => r.text()).catch(() => "");
      const ex = (tag) => { const m = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`)); return m ? m[1].trim() : "unknown"; };
      const txCode = ex("transactionCode");
      const dir = txCode === "P" || txCode === "A" ? "PURCHASED" : txCode === "S" || txCode === "D" ? "SOLD" : `transacted (code: ${txCode})`;
      return `Insider: ${ex("rptOwnerName")}, ${ex("officerTitle")}. They ${dir} ${ex("transactionShares")} shares at $${ex("transactionPricePerShare")} per share on ${ex("transactionDate")}. Shares owned after transaction: ${ex("sharesOwnedFollowingTransaction")}.`;
    }

    if (form === "8-K") {
      const htmMatch = atom.match(/href="(\/Archives\/edgar\/data\/[^"]+\.htm[l]?)"/i);
      if (!htmMatch) return "";
      const htm = await fetch("https://www.sec.gov" + htmMatch[1], {
        headers: { "User-Agent": "apex/1.0 apex@app.com" }
      }).then(r => r.text()).catch(() => "");
      return htm.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000);
    }
  } catch(e) { return ""; }
  return "";
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" } });
  }
  try {
    const body = await req.json();
    let messages = body.messages || [];

    // If filing context provided, fetch the actual SEC data first
    if (body.ticker && body.form) {
      const filingData = await fetchFilingData(body.ticker, body.form);
      if (filingData && messages.length > 0) {
        // Inject real filing data into the user message
        messages = [{
          role: "user",
          content: messages[0].content + "\n\nACTUAL FILING DATA FROM SEC.GOV:\n" + filingData
        }];
      }
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 300, messages })
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}