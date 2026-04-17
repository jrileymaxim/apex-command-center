export const config = { runtime: 'edge' };

const CIKS = {
  AAL:"0000006201", SMCI:"0001375365", ANET:"0001313925", TSM:"0001046179",
  MU:"0000723254", NVDA:"0001045810", CRWV:"0001866175", DVN:"0000315189",
  MNTS:"0001801236", SOUN:"0001653519", BBAI:"0001835016"
};

async function getForm4Data(ticker) {
  const cik = CIKS[ticker]; if (!cik) return "";
  try {
    const subs = await fetch("https://data.sec.gov/submissions/CIK"+cik+".json",{headers:{"User-Agent":"apex/1.0 apex@app.com"}}).then(r=>r.json());
    const recent = subs.filings?.recent||{};
    const forms=recent.form||[], accNums=recent.accessionNumber||[], dates=recent.filingDate||[];
    const idx=forms.findIndex(f=>f==="4"); if(idx===-1) return "";
    const acc=accNums[idx], date=dates[idx], accFmt=acc.replace(/-/g,""), numCik=parseInt(cik);
    const indexData=await fetch("https://www.sec.gov/Archives/edgar/data/"+numCik+"/"+accFmt+"/"+acc+"-index.json",{headers:{"User-Agent":"apex/1.0 apex@app.com"}}).then(r=>r.json()).catch(()=>null);
    if(!indexData) return "";
    const files=indexData.directory?.item||[];
    const xmlFile=files.find(f=>f.name&&f.name.endsWith(".xml")&&!f.name.startsWith("R")&&!f.name.includes("FilingSummary"));
    if(!xmlFile) return "";
    const xml=await fetch("https://www.sec.gov/Archives/edgar/data/"+numCik+"/"+accFmt+"/"+xmlFile.name,{headers:{"User-Agent":"apex/1.0 apex@app.com"}}).then(r=>r.text()).catch(()=>"");
    if(!xml) return "";
    const ex=(tag)=>{const m=xml.match(new RegExp("<"+tag+">([^<]+)</"+tag+">"));return m?m[1].trim():"";};
    const exAll=(tag)=>[...xml.matchAll(new RegExp("<"+tag+">([^<]+)</"+tag+">","g"))].map(m=>m[1].trim());
    const txCodes=exAll("transactionCode"), sharesList=exAll("transactionShares"), prices=exAll("transactionPricePerShare");
    const txSummary=txCodes.map((code,i)=>{
      const dir=code==="P"||code==="A"?"PURCHASED":code==="S"||code==="D"?"SOLD":"transacted("+code+")";
      const sh=sharesList[i]?parseFloat(sharesList[i]).toLocaleString():"?";
      const pr=prices[i]?"$"+parseFloat(prices[i]).toFixed(2):"unknown price";
      return dir+" "+sh+" shares at "+pr;
    }).join("; ");
    const name=ex("rptOwnerName")||"Unknown insider";
    const title=ex("officerTitle");
    const sharesAfter=ex("sharesOwnedFollowingTransaction");
    return "Insider: "+name+(title?", "+title:"")+". Date: "+(ex("transactionDate")||date)+". Transactions: "+txSummary+". Shares owned after: "+parseFloat(sharesAfter||"0").toLocaleString()+".";
  } catch(e){return "";}
}

async function get8KData(ticker) {
  const cik=CIKS[ticker]; if(!cik) return "";
  try {
    const subs=await fetch("https://data.sec.gov/submissions/CIK"+cik+".json",{headers:{"User-Agent":"apex/1.0 apex@app.com"}}).then(r=>r.json());
    const recent=subs.filings?.recent||{};
    const forms=recent.form||[], accNums=recent.accessionNumber||[];
    const idx=forms.findIndex(f=>f==="8-K"); if(idx===-1) return "";
    const acc=accNums[idx], accFmt=acc.replace(/-/g,""), numCik=parseInt(cik);
    const indexData=await fetch("https://www.sec.gov/Archives/edgar/data/"+numCik+"/"+accFmt+"/"+acc+"-index.json",{headers:{"User-Agent":"apex/1.0 apex@app.com"}}).then(r=>r.json()).catch(()=>null);
    if(!indexData) return "";
    const files=indexData.directory?.item||[];
    const htmFile=files.find(f=>f.name&&(f.name.endsWith(".htm")||f.name.endsWith(".html"))&&!f.name.startsWith("R"));
    if(!htmFile) return "";
    const htm=await fetch("https://www.sec.gov/Archives/edgar/data/"+numCik+"/"+accFmt+"/"+htmFile.name,{headers:{"User-Agent":"apex/1.0 apex@app.com"}}).then(r=>r.text()).catch(()=>"");
    return htm.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().substring(0,3000);
  } catch(e){return "";}
}

export default async function handler(req) {
  if(req.method==="OPTIONS") return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST","Access-Control-Allow-Headers":"Content-Type"}});
  try {
    const body=await req.json();
    let messages=body.messages||[];
    let filingData="";
    if(body.ticker&&body.form==="4") filingData=await getForm4Data(body.ticker);
    else if(body.ticker&&body.form==="8-K") filingData=await get8KData(body.ticker);
    if(filingData&&messages.length>0){
      messages=[{role:"user",content:messages[0].content+"\n\nACTUAL SEC FILING DATA:\n"+filingData}];
    }
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY||"","anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:300,messages})});
    const data=await res.json();
    return new Response(JSON.stringify(data),{headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  } catch(e){
    return new Response(JSON.stringify({error:e.message}),{status:500,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  }
}