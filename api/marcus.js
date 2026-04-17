export const config = { runtime: 'edge' };

async function getForm4Data(numCik, acc) {
  try {
    const accFmt = acc.replace(/-/g, "");
    // Direct XML URL — no index needed, standard EDGAR pattern
    const xmlUrl = "https://www.sec.gov/Archives/edgar/data/" + numCik + "/" + accFmt + "/" + acc + ".xml";
    const resp = await fetch(xmlUrl, { headers: { "User-Agent": "apex/1.0 apex@app.com", "Accept": "application/xml, text/xml, */*" } });
    if (!resp.ok) return { error: "fetch failed: " + resp.status + " url: " + xmlUrl };
    const xml = await resp.text();
    if (!xml || xml.length < 50) return { error: "empty or short xml: " + xml.length };
    const ex = (tag) => { const m = xml.match(new RegExp("<" + tag + ">([^<]+)</" + tag + ">")); return m ? m[1].trim() : ""; };
    const exAll = (tag) => [...xml.matchAll(new RegExp("<" + tag + ">([^<]+)</" + tag + ">", "g"))].map(m => m[1].trim());
    const txCodes = exAll("transactionCode");
    const sharesList = exAll("transactionShares");
    const prices = exAll("transactionPricePerShare");
    const txSummary = txCodes.map((code, i) => {
      const dir = code === "P" || code === "A" ? "PURCHASED" : code === "S" || code === "D" ? "SOLD" : "transacted(" + code + ")";
      const sh = sharesList[i] ? parseFloat(sharesList[i]).toLocaleString() : "?";
      const pr = prices[i] ? "$" + parseFloat(prices[i]).toFixed(2) : "no price listed";
      return dir + " " + sh + " shares at " + pr;
    }).join("; ");
    const name = ex("rptOwnerName") || "Unknown insider";
    const title = ex("officerTitle");
    const sharesAfter = ex("sharesOwnedFollowingTransaction");
    const txDate = ex("transactionDate");
    const result = "Insider: " + name + (title ? ", " + title : "") + ". Date: " + txDate + ". What happened: " + txSummary + ". Total shares owned after: " + (sharesAfter ? parseFloat(sharesAfter).toLocaleString() : "not disclosed") + ".";
    return { ok: true, data: result };
  } catch(e) {
    return { error: "exception: " + e.message };
  }
}

async function get8KData(numCik, acc) {
  try {
    const accFmt = acc.replace(/-/g, "");
    // Try the primary document (htm) — standard 8-K pattern
    const htmUrl = "https://www.sec.gov/Archives/edgar/data/" + numCik + "/" + accFmt + "/" + acc + "-index.htm";
    // Use the viewer API which is more permissive
    const viewerUrl = "https://efts.sec.gov/LATEST/search-index?q=%22" + acc + "%22&dateRange=custom&startdt=2026-01-01&enddt=2026-12-31&forms=8-K";
    const resp = await fetch("https://www.sec.gov/Archives/edgar/data/" + numCik + "/" + accFmt + "/" + acc + ".txt", {
      headers: { "User-Agent": "apex/1.0 apex@app.com" }
    });
    if (!resp.ok) return { error: "8K fetch failed: " + resp.status };
    const txt = await resp.text();
    const clean = txt.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000);
    return { ok: true, data: clean };
  } catch(e) {
    return { error: "8K exception: " + e.message };
  }
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" } });
  }
  try {
    const body = await req.json();
    let messages = body.messages || [];
    let filingData = "";
    let debugInfo = null;

    if (body.acc && body.cik) {
      if (body.form === "4") {
        const result = await getForm4Data(body.cik, body.acc);
        debugInfo = result;
        if (result.ok) filingData = result.data;
      } else if (body.form === "8-K") {
        const result = await get8KData(body.cik, body.acc);
        debugInfo = result;
        if (result.ok) filingData = result.data;
      }
    }

    if (filingData && messages.length > 0) {
      messages = [{ role: "user", content: messages[0].content + "\n\nACTUAL SEC FILING DATA FROM EDGAR:\n" + filingData }];
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 300, messages })
    });
    const data = await res.json();
    data._debug = debugInfo;
    data._filingLen = filingData.length;
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}