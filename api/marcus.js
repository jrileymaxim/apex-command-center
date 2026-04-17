export const config = { runtime: 'edge' };

async function fetchXML(numCik, acc) {
  try {
    const accFmt = acc.replace(/-/g, "");
    // Get index to find XML filename
    const indexUrl = `https://www.sec.gov/Archives/edgar/data/${numCik}/${accFmt}/${acc}-index.json`;
    const indexResp = await fetch(indexUrl, { headers: { "User-Agent": "apex/1.0 apex@app.com", "Accept": "application/json" } });
    if (!indexResp.ok) return { error: "index fetch failed: " + indexResp.status };
    const indexData = await indexResp.json();
    const files = (indexData.directory && indexData.directory.item) || [];
    const xmlFile = files.find(f => f.name && f.name.endsWith(".xml") && !f.name.startsWith("R") && !f.name.includes("FilingSummary"));
    if (!xmlFile) return { error: "no xml file found in: " + files.map(f=>f.name).join(",") };
    const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${numCik}/${accFmt}/${xmlFile.name}`;
    const xmlResp = await fetch(xmlUrl, { headers: { "User-Agent": "apex/1.0 apex@app.com" } });
    if (!xmlResp.ok) return { error: "xml fetch failed: " + xmlResp.status };
    const xml = await xmlResp.text();
    if (!xml) return { error: "empty xml" };
    const ex = (tag) => { const m = xml.match(new RegExp("<" + tag + ">([^<]+)</" + tag + ">")); return m ? m[1].trim() : ""; };
    const exAll = (tag) => [...xml.matchAll(new RegExp("<" + tag + ">([^<]+)</" + tag + ">", "g"))].map(m => m[1].trim());
    const txCodes = exAll("transactionCode");
    const sharesList = exAll("transactionShares");
    const prices = exAll("transactionPricePerShare");
    const txSummary = txCodes.map((code, i) => {
      const dir = code === "P" || code === "A" ? "PURCHASED" : code === "S" || code === "D" ? "SOLD" : "transacted(" + code + ")";
      const sh = sharesList[i] ? parseFloat(sharesList[i]).toLocaleString() : "?";
      const pr = prices[i] ? "$" + parseFloat(prices[i]).toFixed(2) : "unknown";
      return dir + " " + sh + " shares at " + pr;
    }).join("; ");
    const name = ex("rptOwnerName") || "Unknown";
    const title = ex("officerTitle");
    const sharesAfter = ex("sharesOwnedFollowingTransaction");
    const txDate = ex("transactionDate");
    return {
      ok: true,
      data: "Insider: " + name + (title ? ", " + title : "") + ". Date: " + txDate + ". Transactions: " + txSummary + ". Shares owned after: " + (sharesAfter ? parseFloat(sharesAfter).toLocaleString() : "unknown") + "."
    };
  } catch(e) {
    return { error: "exception: " + e.message };
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

    // Use pre-fetched acc+cik if provided (client fetched from data.sec.gov)
    if (body.acc && body.cik && body.form === "4") {
      const result = await fetchXML(body.cik, body.acc);
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
    // Include debug info in response temporarily
    data._debug = debugInfo;
    data._filingDataLen = filingData.length;
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}