export const config = { runtime: 'edge' };

async function getForm4Data(numCik, acc, xmlFile) {
  try {
    const accFmt = acc.replace(/-/g, "");
    const xmlUrl = "https://www.sec.gov/Archives/edgar/data/" + numCik + "/" + accFmt + "/" + xmlFile;
    const resp = await fetch(xmlUrl, { headers: { "User-Agent": "apex/1.0 apex@app.com" } });
    if (!resp.ok) return { error: "fetch " + resp.status };
    const xml = await resp.text();
    if (!xml || xml.length < 50) return { error: "empty xml" };

    // Extract first match of any tag (handles nested structures)
    const ex = (tag) => {
      const m = xml.match(new RegExp("<" + tag + "[^>]*>\\s*([^<\\s][^<]*)</" + tag + ">", "i"));
      if (m) return m[1].trim();
      // Try value sub-tag
      const block = xml.match(new RegExp("<" + tag + "[^>]*>[\\s\\S]*?</" + tag + ">", "i"));
      if (block) { const v = block[0].match(/<value>([^<]+)<\/value>/); if(v) return v[1].trim(); }
      return "";
    };
    const exAll = (tag) => {
      const blocks = [...xml.matchAll(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "gi"))];
      return blocks.map(b => {
        // Try direct text first
        const direct = b[1].replace(/<[^>]+>/g, "").trim();
        if (direct) return direct;
        // Try value subtag
        const v = b[1].match(/<value>([^<]+)<\/value>/);
        return v ? v[1].trim() : "";
      }).filter(Boolean);
    };

    const txCodes = exAll("transactionCode");
    const sharesList = exAll("transactionShares");
    const prices = exAll("transactionPricePerShare");

    const txSummary = txCodes.length > 0 ? txCodes.map((code, i) => {
      const dir = code === "P" || code === "A" ? "PURCHASED" : code === "S" || code === "D" ? "SOLD" : "transacted(" + code + ")";
      const sh = sharesList[i] ? parseFloat(sharesList[i]).toLocaleString() : "unknown number of";
      const pr = prices[i] ? "$" + parseFloat(prices[i]).toFixed(2) : "undisclosed price";
      return dir + " " + sh + " shares at " + pr;
    }).join("; ") : "no transactions found";

    const name = ex("rptOwnerName") || "Unknown insider";
    const title = ex("officerTitle") || ex("officerTitle1");
    const sharesAfter = exAll("sharesOwnedFollowingTransaction")[0] || "";
    const txDate = exAll("transactionDate")[0] || "";

    return {
      ok: true,
      data: "Insider: " + name + (title ? ", " + title : "") +
            ". Transaction date: " + (txDate || "not specified") +
            ". What happened: " + txSummary +
            ". Shares owned after transaction: " + (sharesAfter ? parseFloat(sharesAfter).toLocaleString() : "not disclosed") + "."
    };
  } catch(e) { return { error: "exception: " + e.message }; }
}

async function get8KData(numCik, acc, xmlFile) {
  try {
    const accFmt = acc.replace(/-/g, "");
    const url = "https://www.sec.gov/Archives/edgar/data/" + numCik + "/" + accFmt + "/" + xmlFile;
    const resp = await fetch(url, { headers: { "User-Agent": "apex/1.0 apex@app.com" } });
    if (!resp.ok) return { error: "8K fetch " + resp.status };
    const txt = await resp.text();
    return { ok: true, data: txt.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000) };
  } catch(e) { return { error: "8K exception: " + e.message }; }
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" } });
  try {
    const body = await req.json();
    let messages = body.messages || [];
    let filingData = "", debugInfo = null;

    if (body.acc && body.cik && body.xmlFile) {
      const result = body.form === "4" ? await getForm4Data(body.cik, body.acc, body.xmlFile) : await get8KData(body.cik, body.acc, body.xmlFile);
      debugInfo = result;
      if (result.ok) filingData = result.data;
    }

    if (filingData && messages.length > 0) {
      messages = [{ role: "user", content: messages[0].content + "\n\nACTUAL SEC FILING DATA:\n" + filingData }];
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 300, messages })
    });
    const data = await res.json();
    data._debug = debugInfo;
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}