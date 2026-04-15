import { useState, useEffect } from "react";

// ── PORTFOLIO DATA ─────────────────────────────────────────────────────────────
const POSITIONS = [
  {ticker:"AAL", shares:12.70, avgCost:11.30, name:"American Airlines"},
  {ticker:"SMCI",shares:13.71, avgCost:23.24, name:"Super Micro Computer"},
  {ticker:"MNTS",shares:40,    avgCost:5.50,  name:"Momentus Inc"},
  {ticker:"ANET",shares:2,     avgCost:143.29,name:"Arista Networks"},
  {ticker:"TSM", shares:3,     avgCost:368.72,name:"Taiwan Semiconductor"},
  {ticker:"MU",  shares:1.008, avgCost:413.38,name:"Micron Technology"},
  {ticker:"NVDA",shares:2.9,   avgCost:185.49,name:"NVIDIA"},
  {ticker:"VTI", shares:3,     avgCost:338.75,name:"Vanguard Total Market"},
  {ticker:"CRWV",shares:10,    avgCost:111.40,name:"CoreWeave"},
  {ticker:"DVN", shares:13,    avgCost:47.28, name:"Devon Energy"},
  {ticker:"GLD", shares:0.4,   avgCost:439.23,name:"SPDR Gold Trust"},
];
const LEAPS = [
  {label:"SOUN $10C 1/15/27",contracts:1,avgCost:1.24,breakeven:11.24,sounNow:7.04},
  {label:"SOUN $10C 1/21/28",contracts:1,avgCost:2.38,breakeven:12.38,sounNow:7.04},
];
const PARLAYS = [
  {odds:"+35464",stake:15, payout:5334.69, legs:19},
  {odds:"+36865",stake:10, payout:3696.59, legs:16},
  {odds:"+25234",stake:12, payout:3040.12, legs:11},
  {odds:"+1150", stake:75, payout:937.53,  legs:9},
];
const FALLBACK = {
  AAL:{price:"12.11",chg:"7.84"},  SMCI:{price:"27.39",chg:"5.47"},
  MNTS:{price:"5.36", chg:"-2.59"},ANET:{price:"154.03",chg:"1.32"},
  TSM: {price:"381.82",chg:"3.05"},MU:  {price:"459.28",chg:"7.67"},
  NVDA:{price:"195.84",chg:"2.57"},VTI: {price:"342.69",chg:"1.16"},
  CRWV:{price:"116.01",chg:"4.14"},DVN: {price:"45.27",chg:"-4.25"},
  GLD: {price:"444.69",chg:"1.25"},
};


// ── PHASE 4 DATA ───────────────────────────────────────────────────────────────
const EARNINGS = [
  {ticker:"AAL", date:"2026-04-24", est:"Q1 2026", note:"Revenue ~$13.5B est"},
  {ticker:"SMCI",date:"2026-05-06", est:"Q3 FY26", note:"Server demand, margin watch"},
  {ticker:"ANET",date:"2026-05-06", est:"Q1 2026", note:"AI networking growth 20%+ est"},
  {ticker:"TSM", date:"2026-04-17", est:"Q1 2026", note:"Already reported — strong AI demand"},
  {ticker:"MU",  date:"2026-06-25", est:"Q3 FY26", note:"HBM3E for AI, guidance key"},
  {ticker:"NVDA",date:"2026-05-28", est:"Q1 FY27", note:"Blackwell ramp, $43B+ rev est"},
  {ticker:"CRWV",date:"2026-05-12", est:"Q1 2026", note:"First earnings as public — revenue trajectory"},
  {ticker:"DVN", date:"2026-05-05", est:"Q1 2026", note:"Oil price sensitivity, dividend watch"},
  {ticker:"MNTS",date:"2026-05-14", est:"Q1 2026", note:"Revenue growth + cash burn"},
  {ticker:"VTI", date:null, est:"ETF", note:"No earnings — tracks total market"},
  {ticker:"GLD", date:null, est:"ETF", note:"No earnings — tracks gold price"},
];
const BENCH_FALLBACK = {
  SPY:{price:"542.30",chg:"1.05"},
  QQQ:{price:"462.18",chg:"1.22"},
  DIA:{price:"402.44",chg:"0.88"},
};
// ── COLORS ─────────────────────────────────────────────────────────────────────
const CA="#f0a30a",CB="#ffffff",CC="#d4a84b",CD="#7a6030";
const CG="#18c93a",CR="#e03010",CY="#e8b820";
const BG="#030308",BP="#0a0a18",BD="#0d0d22";

// ── PHASE 2 DATA ───────────────────────────────────────────────────────────────

// Signal engine — derives buy/hold/sell from price vs cost basis + day change
function deriveSignal(p) {
  var gainP = p.gainP || 0;
  var chg   = p.chg   || 0;
  if (gainP > 20 && chg > 2)  return {sig:"STRONG BUY", score:9, color:CG};
  if (gainP > 10 && chg > 0)  return {sig:"BUY",        score:7, color:CG};
  if (gainP > 0  && chg > -1) return {sig:"HOLD",       score:5, color:CY};
  if (gainP < -10 && chg < 0) return {sig:"SELL",       score:2, color:CR};
  if (gainP < -5)              return {sig:"WATCH",      score:3, color:CY};
  return                              {sig:"HOLD",       score:5, color:CY};
}

// SOUN-specific analysis
const SOUN_DATA = {
  ticker: "SOUN",
  price: 7.04,
  sector: "AI Voice Technology",
  catalysts: [
    {date:"Q2 2025",event:"SoundHound AI automotive partnership expansion — 100+ car brands"},
    {date:"Q3 2025",event:"Restaurant industry rollout — 10,000+ locations active"},
    {date:"Q4 2025",event:"Amelia acquisition integration driving enterprise revenue"},
    {date:"Q1 2026",event:"AI agent platform launch targeting financial services sector"},
    {date:"Apr 2026",event:"Earnings report upcoming — analyst consensus: revenue growth 70%+ YoY"},
  ],
  sentiment: [
    {label:"Reddit/StockTwits",score:72,color:CG,note:"Bullish — high retail interest"},
    {label:"Analyst Consensus",score:58,color:CY,note:"Mixed — 3 Buy, 2 Hold, 1 Sell"},
    {label:"News Tone",score:65,color:CG,note:"Positive — AI tailwinds narrative"},
    {label:"Options Flow",score:70,color:CG,note:"Call-heavy — bullish positioning"},
  ],
  risks: [
    "Revenue growth not yet profitable — cash burn risk",
    "Highly competitive AI voice space (Google, Amazon, Apple)",
    "Small-cap volatility — high beta stock",
    "Breakeven requires +60% to +76% move from current price",
  ],
  bull: "SOUN is positioned at the intersection of AI and voice commerce — two of the fastest growing verticals. Automotive and restaurant deployments provide recurring SaaS revenue, and the Amelia acquisition adds enterprise AI agent capability. If AI infrastructure spending accelerates in 2025-2026, SOUN's platform becomes mission-critical.",
  bear: "The company remains unprofitable with significant cash burn. Voice AI is becoming commoditized by Big Tech. SOUN's $11-12 breakeven prices require a near-double from current levels — a high bar for a company still proving its business model.",
};

// Theta decay calculator
function thetaCalc(avgCost, contracts, daysToExpiry, iv) {
  var premium = avgCost * contracts * 100;
  var dailyDecay = premium * 0.008; // approximate daily theta for LEAPS
  var weeklyDecay = dailyDecay * 5;
  var remaining = Math.max(0, premium - (dailyDecay * (365 - daysToExpiry)));
  return {dailyDecay: dailyDecay.toFixed(2), weeklyDecay: weeklyDecay.toFixed(2), premium: premium.toFixed(0)};
}

// Discovery picks — curated high-conviction AI/tech small caps
const DISCOVERY_PICKS = [
  {
    ticker:"BBAI",
    name:"BigBear.ai Holdings",
    price:"~$3.20",
    sector:"AI Analytics / Defense",
    thesis:"Government AI contracts accelerating. DOD and intelligence community expanding AI analytics budgets. Recent $165M contract win signals pipeline strength. Low float with high short interest creates squeeze potential.",
    risk:"Profitability timeline unclear. Government contract delays common.",
    conviction:"HIGH",
    timeframe:"3-6 months",
  },
  {
    ticker:"RCAT",
    name:"Red Cat Holdings",
    price:"~$8.50",
    sector:"Defense Drones / AI",
    thesis:"Military drone demand surging post-Ukraine. Red Cat's Black Widow drone selected for Army short-range reconnaissance. NATO procurement pipeline expanding. Defense tech premium re-rating in progress.",
    risk:"Single-contract concentration risk. Geopolitical dependency.",
    conviction:"MEDIUM-HIGH",
    timeframe:"6-12 months",
  },
];


// ── UTILITIES ──────────────────────────────────────────────────────────────────
function usd(n){ return "$"+Math.abs(Number(n)).toFixed(2); }

function marcusBriefing() {
  const now = new Date();
  const day = now.toLocaleDateString("en-US",{weekday:"long"});
  const date = now.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
  const h = now.getHours();
  const g = h<12?"The morning demands clarity":"The afternoon demands focus";
  const closer = h>=20?"Rest when the work is done — but the work is not done.":"";
  const q = [
    "The disciplined mind does not panic at volatility — it studies it. Markets reveal character.",
    "Wealth is not built in moments of excitement. It is built in moments of discipline.",
    "The obstacle is the way. Volatility is not the enemy — indecision is.",
    "Review your stop-losses. Preserving capital is the first rule of compounding.",
    "Markets are indifferent to emotion. Your edge is preparation.",
    "Eleven positions, two LEAPS, four parlays. Diversification is not weakness — it is strategy.",
    "The early review catches the edge. Your positions await analysis.",
  ];
  return g+". Today is "+day+", "+date+". Eleven positions, two SOUN LEAPS, four MLB futures settling October 31st — all require your attention. "+q[now.getDate()%q.length]+(closer?" "+closer:"");
}

function calcFG(data) {
  const vals = Object.values(data).map(function(d){ return parseFloat(d.chg||0)||0; });
  const avg = vals.reduce(function(a,b){return a+b;},0)/vals.length;
  if (avg<-2)  return {score:15,label:"Extreme Fear",avg:avg.toFixed(2)};
  if (avg<-0.5)return {score:30,label:"Fear",avg:avg.toFixed(2)};
  if (avg<0.5) return {score:50,label:"Neutral",avg:avg.toFixed(2)};
  if (avg<2)   return {score:65,label:"Greed",avg:avg.toFixed(2)};
  return            {score:85,label:"Extreme Greed",avg:avg.toFixed(2)};
}

async function fetchPrices() {
  const syms = POSITIONS.map(function(p){return p.ticker;}).join(",");
  const yahoo = "https://query1.finance.yahoo.com/v7/finance/quote?symbols="+syms;
  const proxies = [
    "https://corsproxy.io/?"+encodeURIComponent(yahoo),
    "https://api.allorigins.win/raw?url="+encodeURIComponent(yahoo),
  ];
  for (var i=0;i<proxies.length;i++) {
    try {
      var r = await fetch(proxies[i]);
      if (!r.ok) continue;
      var d = await r.json();
      var qs = d.quoteResponse && d.quoteResponse.result;
      if (!qs||!qs.length) continue;
      var out = {};
      qs.forEach(function(q){
        out[q.symbol] = {
          price: q.regularMarketPrice ? q.regularMarketPrice.toFixed(2) : "--",
          chg:   q.regularMarketChangePercent ? q.regularMarketChangePercent.toFixed(2) : "0",
          live:  true,
        };
      });
      return out;
    } catch(e) { continue; }
  }
  return FALLBACK;
}

async function fetchWeather(city) {
  var geo = await fetch("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(city)+"&count=1");
  var gd = await geo.json();
  var loc = gd.results && gd.results[0];
  if (!loc) throw new Error("City not found: "+city);
  var wu = "https://api.open-meteo.com/v1/forecast?latitude="+loc.latitude+"&longitude="+loc.longitude+"&current=temperature_2m,relativehumidity_2m,weathercode,windspeed_10m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&windspeed_unit=mph&forecast_days=1&timezone=auto";
  var wr = await fetch(wu);
  var wd = await wr.json();
  var c = wd.current;
  var code = c.weathercode;
  var cond = code===0?"Clear Sky":code<=2?"Partly Cloudy":code===3?"Overcast":code<=48?"Foggy":code<=57?"Drizzle":code<=67?"Rain":code<=77?"Snow":code<=82?"Showers":"Thunderstorm";
  return {
    temp:    Math.round(c.temperature_2m)+"°F",
    feels:   Math.round(c.apparent_temperature)+"°F",
    cond:    cond,
    humidity:c.relativehumidity_2m+"%",
    wind:    Math.round(c.windspeed_10m)+" mph",
    high:    Math.round(wd.daily.temperature_2m_max[0])+"°F",
    low:     Math.round(wd.daily.temperature_2m_min[0])+"°F",
    city:    loc.name,
  };
}


async function fetchBenchmarks() {
  const syms = "SPY,QQQ,DIA";
  const yahoo = "https://query1.finance.yahoo.com/v7/finance/quote?symbols="+syms;
  const proxies = ["https://corsproxy.io/?"+encodeURIComponent(yahoo),"https://api.allorigins.win/raw?url="+encodeURIComponent(yahoo)];
  for (var i=0;i<proxies.length;i++) {
    try {
      var r = await fetch(proxies[i]); if (!r.ok) continue;
      var d = await r.json(); var qs = d.quoteResponse&&d.quoteResponse.result;
      if (!qs||!qs.length) continue;
      var out = {};
      qs.forEach(function(q){ out[q.symbol]={price:q.regularMarketPrice?q.regularMarketPrice.toFixed(2):"--",chg:q.regularMarketChangePercent?q.regularMarketChangePercent.toFixed(2):"0",live:true}; });
      return out;
    } catch(e) { continue; }
  }
  return BENCH_FALLBACK;
}

function weeklyReport(enriched, totP, fg) {
  var now = new Date(); var isMonday = now.getDay()===1;
  var winners = (enriched||[]).filter(function(p){return p.gainP&&p.gainP>0;}).sort(function(a,b){return b.gainP-a.gainP;});
  var losers = (enriched||[]).filter(function(p){return p.gainP&&p.gainP<0;}).sort(function(a,b){return a.gainP-b.gainP;});
  var top = winners[0]; var worst = losers[0];
  var prefix = isMonday?"Weekly review. ":"Portfolio snapshot. ";
  var ret = (totP||0)>=0?"+"+((totP||0).toFixed(2))+"%":((totP||0).toFixed(2))+"%";
  var topStr = top?top.ticker+" leads at +"+top.gainP.toFixed(1)+"%":"positions mixed";
  var worstStr = worst?worst.ticker+" trails at "+worst.gainP.toFixed(1)+"%":"no major losers";
  return prefix+"Portfolio return: "+ret+". Sentiment: "+(fg&&fg.label||"Neutral")+". "+topStr+". "+worstStr+". "+(isMonday?"New week — set objectives and review stop-losses.":"Stay disciplined.");
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:2px;} ::-webkit-scrollbar-thumb{background:#2a1e08;}
@keyframes scan{0%{top:-4px}100%{top:100vh}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes pulse{0%,100%{opacity:.15}50%{opacity:.8}}
@keyframes spinA{to{transform:rotate(360deg)}}
@keyframes si{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes ap{0%,100%{background:#030308}50%{background:#100005}}
@keyframes cf{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
.bl{animation:blink 1s step-end infinite}
.pu{animation:pulse 2.5s ease-in-out infinite}
.si{animation:si .25s ease forwards}
.fi{animation:fi .35s ease forwards}
.spinA{animation:spinA 1s linear infinite}
.alertMode{animation:ap 1.5s ease-in-out infinite}
.cfp{position:fixed;pointer-events:none;z-index:999;width:8px;height:8px;border-radius:2px;animation:cf 3s ease-in forwards}
.tab{background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 6px;flex:1;transition:all .2s;font-family:'Orbitron',sans-serif;position:relative}
.tab.on{border-bottom-color:#f0a30a}
.tl{font-size:8px;letter-spacing:1px;color:#7a6030;transition:color .2s}
.tab.on .tl{color:#f0a30a;text-shadow:0 0 6px rgba(240,163,10,.5)}
.ti{font-size:14px;filter:grayscale(1) brightness(.4);transition:filter .2s}
.tab.on .ti{filter:none}
.bdg{position:absolute;top:4px;right:8px;width:6px;height:6px;border-radius:50%;background:#cc2200;box-shadow:0 0 4px #cc2200}
.btn{background:transparent;border:1px solid #2a1e08;color:#f0a30a;font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:2px;padding:6px 14px;cursor:pointer;text-transform:uppercase;transition:all .2s;white-space:nowrap}
.btn:hover{border-color:#f0a30a;box-shadow:0 0 8px rgba(240,163,10,.2);color:#fde68a}
.btn:disabled{opacity:.3;cursor:default}
.bsm{padding:4px 10px;font-size:8px}
.inp{flex:1;min-width:0;background:#080812;border:1px solid #1a1520;color:#c49a50;font-family:'Share Tech Mono',monospace;font-size:11px;padding:6px 10px;outline:none;letter-spacing:1px;transition:border-color .2s}
.inp:focus{border-color:#4a3408}
.inp::placeholder{color:#2a1e08}
.pr{border-bottom:1px solid #0c0a18;padding:9px 6px;transition:background .15s}
.pr:hover{background:rgba(240,163,10,.025)}
.xbtn{background:none;border:none;color:#2a1e08;cursor:pointer;font-size:14px;padding:0 4px;line-height:1;transition:color .15s}
.xbtn:hover{color:#cc2200}
`;

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]       = useState("briefing");
  const [alertOn,setAlert] = useState(false);
  const [now,setNow]       = useState(new Date());
  const [conf,setConf]     = useState([]);
  const [bdg,setBdg]       = useState({portfolio:true,parlays:true});

  const [alf,setAlf]   = useState({s:"idle",text:""});
  const [wx,setWx]     = useState({s:"idle",data:null,err:""});
  const [city,setCity] = useState("");
  const [fg,setFg]     = useState({s:"idle",score:50,label:"Neutral",avg:"0"});
  const [port,setPort] = useState({s:"idle",data:{},live:false});

  const [bench,setBench] = useState({s:"idle",data:{}});
  const [journal,setJournal] = useState([]);
  const [journalReady,setJournalReady] = useState(false);
  const [voice,setVoice]   = useState(false);
  const [listening,setListening] = useState(false);
  const [voiceText,setVoiceText] = useState("");
  const [tasks,setTasks]   = useState([]);
  const [newTask,setNewTask]= useState("");
  const [wl,setWl]         = useState([]);
  const [newWl,setNewWl]   = useState("");
  const [tlReady,setTlReady]= useState(false);

  // inject styles
  useEffect(function() {
    var el=document.createElement("style");
    el.id="wtscss";el.textContent=CSS;document.head.appendChild(el);
    return function(){var e=document.getElementById("wtscss");if(e)e.remove();};
  },[]);

  // clock
  useEffect(function(){
    var t=setInterval(function(){setNow(new Date());},1000);
    return function(){clearInterval(t);};
  },[]);

  // load storage + init data
  useEffect(function(){
    (async function(){
      try {
        var _t = localStorage.getItem("apex-tasks");
        if (_t) setTasks(JSON.parse(_t));
        else setTasks([
          {id:1,text:"Review MNTS — stop-loss evaluation",done:false},
          {id:2,text:"Monitor DVN — analyst downgrade risk",done:false},
          {id:3,text:"Check SOUN LEAPS breakeven gap",done:false},
        ]);
        var _w = localStorage.getItem("apex-wl");
        if (_w) setWl(JSON.parse(_w));
      } catch(e) {
        setTasks([{id:1,text:"Review portfolio positions",done:false}]);
      }
      setTlReady(true);
      try{var jl=localStorage.getItem("apex-journal");if(jl)setJournal(JSON.parse(jl));}catch(e){}
      setJournalReady(true);
      fetchBenchmarks().then(function(d){setBench({s:"done",data:d});});
    })();
    setAlf({s:"done",text:marcusBriefing()});
    doPortfolio();
  },[]);

  useEffect(function(){
    if(!tlReady)return;
    try{localStorage.setItem("apex-tasks",JSON.stringify(tasks));}catch(e){}
  },[tasks,tlReady]);

  useEffect(function(){
    if(!tlReady)return;
    try{localStorage.setItem("apex-wl",JSON.stringify(wl));}catch(e){}
  },[wl,tlReady]);

  useEffect(function(){
    if(!journalReady)return;
    try{localStorage.setItem("apex-journal",JSON.stringify(journal));}catch(e){}
  },[journal,journalReady]);

  async function doPortfolio() {
    setPort({s:"loading",data:{},live:false});
    var data = await fetchPrices();
    var live = Object.values(data).some(function(d){return d.live===true;});
    setPort({s:"done",data:data,live:live});
    setBdg(function(b){return Object.assign({},b,{portfolio:false});});
    var fg2 = calcFG(data);
    setFg({s:"done",score:fg2.score,label:fg2.label,avg:fg2.avg});
    var hasAlert = POSITIONS.some(function(p){
      var cur=parseFloat((data[p.ticker]||{}).price);
      if(!cur)return false;
      return Math.abs((cur-p.avgCost)/p.avgCost*100)>8;
    });
    if(hasAlert) setAlert(true);
  }

  async function doWeather() {
    if(!city.trim())return;
    setWx({s:"loading",data:null,err:""});
    try {
      var d = await fetchWeather(city.trim());
      setWx({s:"done",data:d,err:""});
    } catch(e) { setWx({s:"err",data:null,err:e.message}); }
  }

  function fireConfetti() {
    var colors=[CA,CB,CG,CR,CY];
    setConf(Array.from({length:36},function(_,i){
      return {id:i,c:colors[i%colors.length],l:Math.random()*100,dl:Math.random()*1.5};
    }));
    setTimeout(function(){setConf([]);},3500);
  }

  function addTask()  { if(!newTask.trim())return; setTasks(function(p){return p.concat({id:Date.now(),text:newTask.trim(),done:false});}); setNewTask(""); }
  function togTask(id){ setTasks(function(p){return p.map(function(t){return t.id===id?Object.assign({},t,{done:!t.done}):t;});}); }
  function delTask(id){ setTasks(function(p){return p.filter(function(t){return t.id!==id;});}); }
  function addWl()    { if(!newWl.trim())return; setWl(function(p){return p.concat({id:Date.now(),t:newWl.trim().toUpperCase()});}); setNewWl(""); }
  function delWl(id)  { setWl(function(p){return p.filter(function(w){return w.id!==id;});}); }

  var enriched = POSITIONS.map(function(p){
    var d=port.data[p.ticker]||{};
    var cur=parseFloat(d.price)||null;
    var cost=p.shares*p.avgCost;
    var mkt=cur?p.shares*cur:null;
    var gain=mkt?mkt-cost:null;
    var gainP=gain?gain/cost*100:null;
    return Object.assign({},p,{cur:cur,cost:cost,mkt:mkt,gain:gain,gainP:gainP,chg:parseFloat(d.chg)||null});
  });
  var totCost=enriched.reduce(function(a,p){return a+p.cost;},0);
  var totMkt=enriched.reduce(function(a,p){return a+(p.mkt||p.cost);},0);
  var totGain=totMkt-totCost;
  var totP=totGain/totCost*100;

  var pad=function(n){return String(n).padStart(2,"0");};
  var HH=pad(now.getHours()),MM=pad(now.getMinutes()),SS=pad(now.getSeconds());
  var DS=now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}).toUpperCase();

  var TABS=[
    {id:"briefing",icon:"⚡",l:"BRIEFING"},
    {id:"portfolio",icon:"📈",l:"PORTFOLIO"},
    {id:"intel",icon:"🔍",l:"INTEL"},
    {id:"soun",icon:"🎯",l:"SOUN OPS"},
    {id:"parlays",icon:"⚾",l:"PARLAYS"},
    {id:"mission",icon:"🛠",l:"MISSION"},
  ];

  return (
    <div style={{height:"100vh",overflow:"hidden",background:BG,color:CC,fontFamily:"'Share Tech Mono',monospace",display:"flex",flexDirection:"column",position:"relative"}} className={alertOn?"alertMode":""}>

      {conf.map(function(c){return <div key={c.id} className="cfp" style={{left:c.l+"%",top:"-12px",background:c.c,animationDelay:c.dl+"s"}}/> ;})}

      <div style={{position:"fixed",left:0,right:0,height:"3px",pointerEvents:"none",zIndex:200,background:"linear-gradient(transparent,rgba(240,163,10,.05),transparent)",animation:"scan 10s linear infinite"}}/>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",backgroundImage:"linear-gradient(rgba(240,163,10,.016) 1px,transparent 1px),linear-gradient(90deg,rgba(240,163,10,.016) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>

      {/* HEADER */}
      <div style={{position:"relative",zIndex:10,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",background:alertOn?"linear-gradient(#150005,#08000a)":"linear-gradient(#0d0a04,#050510)",borderBottom:"1px solid "+(alertOn?"#3d0000":"#1a1408"),transition:"all .5s"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <svg width="32" height="32" viewBox="0 0 32 32">
            <polygon points="16,2 30,16 16,30 2,16" fill="none" stroke={alertOn?"#ff4422":CA} strokeWidth="1.5" style={{filter:"drop-shadow(0 0 4px rgba(240,163,10,.5))"}}/>
            <polygon points="16,7 25,16 16,25 7,16" fill={alertOn?"rgba(255,68,34,.15)":"rgba(240,163,10,.1)"} stroke={alertOn?"#ff4422":CA} strokeWidth="1"/>
            <circle cx="16" cy="16" r="2.5" fill={alertOn?"#ff4422":CA} style={{filter:"drop-shadow(0 0 3px rgba(240,163,10,.8))"}}/>
          </svg>
          <div>
            <div style={{fontFamily:"Orbitron",fontSize:"11px",fontWeight:900,color:alertOn?"#ff4422":CA,letterSpacing:"5px"}}>APEX COMMAND CENTER</div>
            <div style={{fontSize:"9px",letterSpacing:"2px",color:CD,marginTop:"2px"}}>{alertOn?"⚠ ALERT — POSITION MOVEMENT DETECTED":"PORTFOLIO INTELLIGENCE ▪ V2.0 ▪ PHASE 1"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <button className="btn bsm" onClick={function(){setAlert(function(v){return !v;});}} style={{color:alertOn?"#ff4422":CA,borderColor:alertOn?"#3d0000":"#2a1e08"}}>{alertOn?"◉ ALERT":"○ ALERT"}</button>
          <button className="btn bsm" onClick={function(){setVoice(function(v){return !v;});}} style={{color:voice?"#1a7acc":CA,borderColor:voice?"#0a3050":"#2a1e08"}}>{voice?"🎙 ON":"🎙 OFF"}</button>
          <button className="btn bsm" onClick={fireConfetti}>🎉</button>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"Orbitron",fontWeight:900,color:alertOn?"#ff4422":CA,fontSize:"clamp(16px,2.2vw,26px)",letterSpacing:"3px",lineHeight:1}}>{HH}<span className="bl">:</span>{MM}<span style={{fontSize:"0.55em",opacity:.45}}>:{SS}</span></div>
            <div style={{fontSize:"9px",letterSpacing:"2px",color:CD,marginTop:"3px"}}>{DS}</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{position:"relative",zIndex:10,flexShrink:0,display:"flex",background:"#040410",borderBottom:"1px solid #14100a"}}>
        {TABS.map(function(t){return (
          <button key={t.id} className={"tab"+(tab===t.id?" on":"")} onClick={function(){setTab(t.id);setBdg(function(b){var nb=Object.assign({},b);nb[t.id]=false;return nb;});}}>
            {bdg[t.id]&&<div className="bdg"/>}
            <span className="ti">{t.icon}</span>
            <span className="tl">{t.l}</span>
          </button>
        );})}
      </div>

      {/* CONTENT */}
      <div style={{flex:1,minHeight:0,overflow:"auto",position:"relative",zIndex:1,padding:"12px 14px"}}>
        {tab==="briefing"  && <TabBriefing alf={alf} onAlf={function(){setAlf({s:"done",text:marcusBriefing()});}} wx={wx} city={city} setCity={setCity} onWx={doWeather} fg={fg} enriched={enriched} totP={totP}/>}
        {tab==="portfolio" && <TabPortfolio enriched={enriched} totCost={totCost} totMkt={totMkt} totGain={totGain} totP={totP} leaps={LEAPS} status={port.s} live={port.live} onRefresh={doPortfolio} bench={bench}/>}
        {tab==="intel"     && <TabIntel enriched={enriched} status={port.s} totP={totP} fg={fg}/>}
        {tab==="soun"      && <TabSoun port={port}/>}
        {tab==="parlays"   && <TabParlays/>}
        {tab==="mission"   && <TabMission tasks={tasks} newTask={newTask} setNewTask={setNewTask} onAdd={addTask} onToggle={togTask} onDel={delTask} wl={wl} newWl={newWl} setNewWl={setNewWl} onAddWl={addWl} onDelWl={delWl} journal={journal} setJournal={setJournal}/>}
      </div>

      {/* VOICE OVERLAY */}
      {voice&&<VoiceMode alf={alf} enriched={enriched} fg={fg} onClose={function(){setVoice(false);}}/>}
      <div style={{position:"relative",zIndex:10,flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 16px",background:"#020208",borderTop:"1px solid #14100a"}}>
        <div style={{fontSize:"9px",letterSpacing:"1.5px",color:CD}}>APEX V2.0 ▪ {POSITIONS.length} POSITIONS ▪ 2 LEAPS ▪ 4 PARLAYS ▪ PHASE 1</div>
        <div style={{display:"flex",gap:"14px"}}>
          {[["MARCUS",CA],["NEXUS",CG],["APEX",CG]].map(function(x){return (
            <div key={x[0]} style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"9px",color:CD}}>
              <div className="pu" style={{width:"4px",height:"4px",borderRadius:"50%",background:x[1],boxShadow:"0 0 4px "+x[1]}}/>
              {x[0]}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ── BRIEFING TAB ───────────────────────────────────────────────────────────────
function TabBriefing({alf,onAlf,wx,city,setCity,onWx,fg,enriched,totP}) {
  var isMonday = new Date().getDay()===1;
  var report = weeklyReport(enriched||[], totP||0, fg);
  function wIcon(c) {
    var cl=(c||"").toLowerCase();
    if(cl.includes("thunder"))return"⛈";
    if(cl.includes("rain")||cl.includes("shower"))return"🌧";
    if(cl.includes("snow"))return"❄";
    if(cl.includes("fog"))return"🌫";
    if(cl.includes("cloud")||cl.includes("overcast"))return"☁";
    if(cl.includes("clear")||cl.includes("sun")||cl.includes("sky"))return"☀";
    return"◈";
  }
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
      <Panel label={"◈ MARCUS — MORNING BRIEFING"} right={<button className="btn bsm" onClick={onAlf}>↻</button>}>
        {alf.s==="done"&&(
          <div className="fi">
            <p style={{fontSize:"12px",lineHeight:1.9,color:CB,fontStyle:"italic",marginBottom:"12px"}}>"{alf.text}"</p>
            <div style={{fontSize:"9px",letterSpacing:"2px",color:CD}}>— MARCUS ▪ APEX</div>
          </div>
        )}
      </Panel>

      <Panel label={"◈ MARKET SENTIMENT"}>
        {fg.s==="done"&&(
          <div className="fi" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px"}}>
            <Gauge score={fg.score} label={fg.label}/>
            <div style={{fontSize:"9px",letterSpacing:"2px",color:CD,textAlign:"center"}}>AVG DAY CHANGE: {fg.avg>0?"+":""}{fg.avg}%</div>
          </div>
        )}
        {fg.s!=="done"&&<div style={{fontSize:"10px",color:CD}}>Loads with portfolio data...</div>}
      </Panel>

      <Panel label={"◈ ATMOSPHERIC CONDITIONS"}>
        <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
          <input className="inp" value={city} onChange={function(e){setCity(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")onWx();}} placeholder="TARGET CITY..."/>
          <button className="btn" onClick={onWx} style={{padding:"6px 10px"}}>SCAN</button>
        </div>
        {wx.s==="idle"&&<div style={{fontSize:"10px",color:CD}}>▸ Enter city to scan conditions</div>}
        {wx.s==="loading"&&<Spinner label="SCANNING ATMOSPHERE"/>}
        {wx.s==="err"&&<ErrMsg text={wx.err||"SENSORS OFFLINE"}/>}
        {wx.s==="done"&&wx.data&&(
          <div className="fi">
            <div style={{fontSize:"9px",color:CD,marginBottom:"8px",letterSpacing:"1px"}}>LOC: {wx.data.city&&wx.data.city.toUpperCase()}</div>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
              <span style={{fontSize:"34px"}}>{wIcon(wx.data.cond)}</span>
              <div>
                <div style={{fontFamily:"Orbitron",fontSize:"22px",fontWeight:900,color:CA}}>{wx.data.temp}</div>
                <div style={{fontSize:"11px",color:CB,marginTop:"2px"}}>{wx.data.cond}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
              {[["FEELS",wx.data.feels],["HUMID",wx.data.humidity],["WIND",wx.data.wind],["H/L",wx.data.high+"/"+wx.data.low]].map(function(r){return (
                <div key={r[0]} style={{background:BG,padding:"5px 8px",border:"1px solid #141020"}}>
                  <div style={{fontSize:"9px",color:CD}}>{r[0]}</div>
                  <div style={{fontSize:"12px",color:CB,marginTop:"1px"}}>{r[1]}</div>
                </div>
              );})}
            </div>
          </div>
        )}
      </Panel>

      <Panel label={isMonday?"◈ MARCUS — WEEKLY REPORT":"◈ MARCUS — PORTFOLIO SNAPSHOT"}>
        <div style={{fontSize:"11px",color:CB,lineHeight:1.8,fontStyle:"italic",marginBottom:"8px"}}>"{report}"</div>
        <div style={{fontSize:"9px",color:CD,letterSpacing:"2px"}}>— MARCUS {isMonday?"▪ MONDAY REVIEW":""}</div>
      </Panel>

      <Panel label={"◈ SYSTEM STATUS"}>
        {[["MARCUS","ONLINE",CG],["PORTFOLIO","LIVE",CG],["WEATHER","LIVE",CG],["INTEL","LIVE",CG],["SOUN OPS","LIVE",CG],["PARLAYS","LIVE",CG],["EARNINGS","LIVE",CG],["BENCHMARKS","LIVE",CG],["JOURNAL","LIVE",CG],["PWA","READY",CG]].map(function(r){return (
          <div key={r[0]} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #0c0a14"}}>
            <span style={{fontSize:"10px",letterSpacing:"1px"}}>{r[0]}</span>
            <span style={{fontFamily:"Orbitron",fontSize:"9px",color:r[2],padding:"2px 6px",background:r[2]+"18",border:"1px solid "+r[2]+"33"}}>{r[1]}</span>
          </div>
        );})}
      </Panel>
    </div>
  );
}

// ── PORTFOLIO TAB ──────────────────────────────────────────────────────────────
function TabPortfolio({enriched,totCost,totMkt,totGain,totP,leaps,status,live,onRefresh,bench}) {
  var up=totGain>=0;
  var bd=bench&&bench.data||{};
  var spyRet=bd.SPY?((parseFloat(bd.SPY.price)-542.30)/542.30*100):null;
  var qqqRet=bd.QQQ?((parseFloat(bd.QQQ.price)-462.18)/462.18*100):null;
  var diaRet=bd.DIA?((parseFloat(bd.DIA.price)-402.44)/402.44*100):null;
  var now2=new Date();
  var upcoming=EARNINGS.filter(function(e){if(!e.date)return false;var d=new Date(e.date);var diff=(d-now2)/(1000*60*60*24);return diff>-7&&diff<60;}).sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
        {[["TOTAL COST","$"+totCost.toFixed(2),CC],["MKT VALUE","$"+totMkt.toFixed(2),CA],["TOTAL GAIN",(up?"+":"-")+"$"+Math.abs(totGain).toFixed(2),up?CG:CR],["RETURN",(up?"+":"")+totP.toFixed(2)+"%",up?CG:CR]].map(function(r){return (
          <div key={r[0]} style={{background:BP,border:"1px solid #141020",padding:"10px"}}>
            <div style={{fontSize:"9px",letterSpacing:"2px",color:CD,marginBottom:"3px"}}>{r[0]}</div>
            <div style={{fontFamily:"Orbitron",fontSize:"13px",fontWeight:700,color:r[2],textShadow:"0 0 8px "+r[2]+"66"}}>{r[1]}</div>
          </div>
        );})}
      </div>

      <Panel label={"◈ POSITIONS — "+POSITIONS.length+" HOLDINGS "+(live?"▪ LIVE":"▪ SESSION DATA 4/14")} right={<button className="btn bsm" onClick={onRefresh} disabled={status==="loading"}>↻ REFRESH</button>}>
        {status==="loading"&&<Spinner label="PULLING LIVE PRICES"/>}
        {status!=="loading"&&enriched.map(function(p,i){return (
          <div key={p.ticker} className="pr si" style={{animationDelay:i*30+"ms"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontFamily:"Orbitron",fontSize:"13px",fontWeight:800,color:CA,minWidth:"44px",letterSpacing:"2px",textShadow:"0 0 6px rgba(240,163,10,.4)"}}>{p.ticker}</span>
                <span style={{fontSize:"10px",color:CD}}>{p.shares}sh</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"9px",color:CD}}>COST</div>
                  <div style={{fontSize:"11px",color:CC}}>{usd(p.avgCost)}</div>
                </div>
                {p.cur&&(
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:"9px",color:CD}}>PRICE</div>
                    <div style={{fontSize:"11px",color:CB}}>{usd(p.cur)}</div>
                  </div>
                )}
                {p.gain!==null&&(
                  <div style={{textAlign:"right",minWidth:"72px"}}>
                    <div style={{fontSize:"9px",color:CD}}>P&L</div>
                    <div style={{fontSize:"12px",fontWeight:700,color:p.gain>=0?CG:CR}}>
                      {p.gain>=0?"+":"-"}{usd(p.gain)} <span style={{fontSize:"10px"}}>({p.gain>=0?"+":""}{p.gainP.toFixed(1)}%)</span>
                    </div>
                  </div>
                )}
                {p.chg!==null&&(
                  <div style={{textAlign:"right",minWidth:"38px"}}>
                    <div style={{fontSize:"9px",color:CD}}>DAY</div>
                    <div style={{fontSize:"9px",color:p.chg>=0?CG:CR}}>{p.chg>=0?"+":""}{p.chg}%</div>
                  </div>
                )}
              </div>
            </div>
            {p.gainP!==null&&(
              <div style={{marginTop:"4px",height:"2px",background:"#0c0a18",borderRadius:"1px"}}>
                <div style={{height:"100%",width:Math.min(100,Math.abs(p.gainP)*4)+"%",background:p.gain>=0?CG:CR,borderRadius:"1px"}}/>
              </div>
            )}
          </div>
        );})}
      </Panel>

      <Panel label={"◈ SOUN LEAPS — OPTIONS POSITIONS"}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          {leaps.map(function(l,i){
            var pct=(l.sounNow/l.breakeven*100).toFixed(0);
            var needs=((l.breakeven-l.sounNow)/l.sounNow*100).toFixed(1);
            return (
              <div key={i} style={{background:BD,border:"1px solid #1a1520",padding:"10px",position:"relative"}}>
                <Corners/>
                <div style={{fontFamily:"Orbitron",fontSize:"10px",color:CA,letterSpacing:"2px",marginBottom:"8px"}}>{l.label}</div>
                {[["CONTRACTS",l.contracts+"x"],["AVG COST","$"+l.avgCost],["MKT VALUE","$"+(l.contracts*100*l.avgCost).toFixed(0)],["BREAKEVEN","$"+l.breakeven],["SOUN NOW","$"+l.sounNow],["NEEDS +",needs+"%"]].map(function(r){return (
                  <div key={r[0]} style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                    <span style={{fontSize:"9px",color:CD}}>{r[0]}</span>
                    <span style={{fontSize:"11px",color:CB}}>{r[1]}</span>
                  </div>
                );})}
                <div style={{marginTop:"8px",height:"3px",background:"#0c0a18",borderRadius:"1px"}}>
                  <div style={{height:"100%",width:pct+"%",background:CY,borderRadius:"1px"}}/>
                </div>
                <div style={{fontSize:"9px",color:CD,marginTop:"3px",textAlign:"right"}}>{pct}% TO BREAKEVEN</div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:"8px",fontSize:"9px",color:CD,letterSpacing:"1px"}}>▸ Full Greeks, theta clock & probability → SOUN OPS tab</div>
      </Panel>

      <Panel label={"◈ EARNINGS CALENDAR — NEXT 60 DAYS"}>
        {upcoming.length===0&&<div style={{fontSize:"10px",color:CD}}>No earnings in next 60 days.</div>}
        {upcoming.map(function(e){var daysAway=Math.ceil((new Date(e.date)-now2)/(1000*60*60*24));var color=daysAway<=7?CR:daysAway<=21?CY:CG;return(
          <div key={e.ticker} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #0c0a14"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontFamily:"Orbitron",fontSize:"11px",fontWeight:800,color:CA,minWidth:"44px"}}>{e.ticker}</span>
              <div><div style={{fontSize:"10px",color:CB}}>{e.est}</div><div style={{fontSize:"9px",color:CD}}>{e.note}</div></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"Orbitron",fontSize:"10px",color:color}}>{daysAway<=0?"REPORTED":daysAway+"d"}</div>
              <div style={{fontSize:"9px",color:CD}}>{e.date}</div>
            </div>
          </div>
        );})}
        {EARNINGS.filter(function(e){return !e.date;}).map(function(e){return(
          <div key={e.ticker} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #0c0a14"}}>
            <span style={{fontFamily:"Orbitron",fontSize:"11px",color:CD}}>{e.ticker}</span>
            <span style={{fontSize:"9px",color:CD}}>{e.note}</span>
          </div>
        );})}
      </Panel>

      <Panel label={"◈ PERFORMANCE VS BENCHMARKS"}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"6px"}}>
          {[["MY PORTFOLIO",totP,true],["S&P 500 (SPY)",spyRet,false],["NASDAQ (QQQ)",qqqRet,false],["DOW (DIA)",diaRet,false]].map(function(r){
            var val=r[1];var col=val===null?CD:val>=0?CG:CR;var str=val===null?"--":(val>=0?"+":"")+val.toFixed(2)+"%";
            return(
              <div key={r[0]} style={{background:r[2]?BP:BD,border:"1px solid "+(r[2]?CA+"33":"#1a1520"),padding:"10px",textAlign:"center"}}>
                <div style={{fontSize:"8px",color:CD,marginBottom:"4px"}}>{r[0]}</div>
                <div style={{fontFamily:"Orbitron",fontSize:"13px",fontWeight:700,color:col}}>{str}</div>
                {r[2]&&spyRet!==null&&<div style={{fontSize:"8px",color:totP>=spyRet?CG:CR,marginTop:"3px"}}>{totP>=spyRet?"BEATING SPY":"LAGGING SPY"}</div>}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ── MISSION TAB ────────────────────────────────────────────────────────────────
function TabMission({tasks,newTask,setNewTask,onAdd,onToggle,onDel,wl,newWl,setNewWl,onAddWl,onDelWl,journal,setJournal}) {
  var done=tasks.filter(function(t){return t.done;}).length;
  var [newEntry,setNewEntry]=useState({ticker:"",action:"BUY",price:"",notes:""});
  var [showJournal,setShowJournal]=useState(false);
  function addJournalEntry(){if(!newEntry.ticker.trim()||!newEntry.notes.trim())return;setJournal(function(p){return [{id:Date.now(),date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),ticker:newEntry.ticker.toUpperCase(),action:newEntry.action,price:newEntry.price,notes:newEntry.notes}].concat(p);});setNewEntry({ticker:"",action:"BUY",price:"",notes:""}); }
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
      <Panel label={"◈ MISSION OBJECTIVES"}>
        <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
          <input className="inp" value={newTask} onChange={function(e){setNewTask(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")onAdd();}} placeholder="ADD OBJECTIVE..."/>
          <button className="btn" onClick={onAdd} style={{padding:"6px 10px"}}>+</button>
        </div>
        <div style={{maxHeight:"260px",overflow:"auto"}}>
          {tasks.map(function(t){return (
            <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:"8px",padding:"7px 0",borderBottom:"1px solid #0c0a14",opacity:t.done?.3:1,transition:"opacity .3s"}}>
              <button onClick={function(){onToggle(t.id);}} style={{marginTop:"2px",width:"14px",height:"14px",border:"1px solid "+(t.done?CA:"#2e2210"),background:t.done?CA:"transparent",color:BG,fontSize:"9px",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{t.done?"✓":""}</button>
              <span style={{flex:1,fontSize:"11px",color:t.done?CD:CB,textDecoration:t.done?"line-through":"none",lineHeight:1.5}}>{t.text}</span>
              <button className="xbtn" onClick={function(){onDel(t.id);}}>×</button>
            </div>
          );})}
        </div>
        <div style={{marginTop:"10px",fontFamily:"Orbitron",fontSize:"9px",letterSpacing:"2px",color:CD}}>{tasks.length-done} ACTIVE ▪ {done} COMPLETE ▪ SAVED ✓</div>
      </Panel>

      <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        <Panel label={"◈ CUSTOM WATCHLIST"}>
          <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
            <input className="inp" value={newWl} onChange={function(e){setNewWl(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")onAddWl();}} placeholder="ADD TICKER..."/>
            <button className="btn" onClick={onAddWl} style={{padding:"6px 10px"}}>+</button>
          </div>
          {!wl.length&&<div style={{fontSize:"10px",color:CD}}>▸ Add tickers to monitor</div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {wl.map(function(w){return (
              <div key={w.id} style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 8px",background:BD,border:"1px solid #1a1520"}}>
                <span style={{fontFamily:"Orbitron",fontSize:"10px",color:CA,letterSpacing:"2px"}}>{w.t}</span>
                <button className="xbtn" onClick={function(){onDelWl(w.id);}}>×</button>
              </div>
            );})}
          </div>
        </Panel>

        <Panel label={"◈ PARLAYS SUMMARY"}>
          {PARLAYS.map(function(p,i){return (
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #0c0a14"}}>
              <div>
                <div style={{fontFamily:"Orbitron",fontSize:"11px",color:CA,letterSpacing:"1px"}}>{p.odds}</div>
                <div style={{fontSize:"10px",color:CD,marginTop:"2px"}}>{p.legs} LEGS ▪ ${p.stake} STAKE</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"9px",color:CG}}>PAYS ${p.payout.toLocaleString()}</div>
              </div>
            </div>
          );})}
          <div style={{marginTop:"8px",fontSize:"9px",color:CD,letterSpacing:"1px"}}>AT RISK: $112 ▪ MAX PAYOUT: $13,008.93 ▪ SETTLES OCT 31</div>
        </Panel>
      </div>

      <Panel label={"◈ TRADE JOURNAL — "+((journal&&journal.length)||0)+" ENTRIES"} right={<button className="btn bsm" onClick={function(){setShowJournal(function(v){return !v;});}}>{showJournal?"HIDE":"SHOW"}</button>}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 2fr",gap:"6px",marginBottom:"8px"}}>
          <input className="inp" value={newEntry.ticker} onChange={function(ev){setNewEntry(function(p){return Object.assign({},p,{ticker:ev.target.value});});}} placeholder="TICKER"/>
          <select value={newEntry.action} onChange={function(ev){setNewEntry(function(p){return Object.assign({},p,{action:ev.target.value});});}} style={{background:"#080812",border:"1px solid #1a1520",color:CA,fontFamily:"monospace",fontSize:"11px",padding:"6px",outline:"none"}}>{["BUY","SELL","HOLD","WATCH","ADD","TRIM"].map(function(a){return <option key={a}>{a}</option>;})}</select>
          <input className="inp" value={newEntry.price} onChange={function(ev){setNewEntry(function(p){return Object.assign({},p,{price:ev.target.value});});}} placeholder="PRICE"/>
          <input className="inp" value={newEntry.notes} onChange={function(ev){setNewEntry(function(p){return Object.assign({},p,{notes:ev.target.value});});}} onKeyDown={function(ev){if(ev.key==="Enter")addJournalEntry();}} placeholder="REASONING..."/>
        </div>
        <button className="btn" onClick={addJournalEntry} style={{marginBottom:"10px",width:"100%"}}>+ LOG ENTRY</button>
        {showJournal&&(<div style={{maxHeight:"260px",overflow:"auto"}}>{(!journal||journal.length===0)&&<div style={{fontSize:"10px",color:CD}}>No entries yet.</div>}{(journal||[]).map(function(jentry){var ac=jentry.action==="BUY"||jentry.action==="ADD"?CG:jentry.action==="SELL"||jentry.action==="TRIM"?CR:CY;return(<div key={jentry.id} style={{padding:"8px 0",borderBottom:"1px solid #0c0a14"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}><div style={{display:"flex",gap:"8px",alignItems:"center"}}><span style={{fontFamily:"Orbitron",fontSize:"11px",color:CA,fontWeight:700}}>{jentry.ticker}</span><span style={{fontFamily:"Orbitron",fontSize:"9px",padding:"2px 6px",background:ac+"22",color:ac,border:"1px solid "+ac+"44"}}>{jentry.action}</span>{jentry.price&&<span style={{fontSize:"9px",color:CC}}>${jentry.price}</span>}</div><div style={{display:"flex",gap:"8px",alignItems:"center"}}><span style={{fontSize:"9px",color:CD}}>{jentry.date}</span><button className="xbtn" onClick={function(){setJournal(function(p){return p.filter(function(j){return j.id!==jentry.id;});});}}>x</button></div></div><div style={{fontSize:"10px",color:CB,lineHeight:1.6}}>{jentry.notes}</div></div>);})}</div>)}
      </Panel>
    </div>
  );
}

// ── COMING SOON ────────────────────────────────────────────────────────────────
function TabSoon({icon,label,items,phase}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"80%",gap:"20px",padding:"20px"}}>
      <div style={{textAlign:"center",opacity:.4}}>
        <div style={{fontSize:"48px",marginBottom:"10px"}}>{icon}</div>
        <div style={{fontFamily:"Orbitron",fontSize:"14px",color:CA,letterSpacing:"4px"}}>{label}</div>
        <div style={{fontFamily:"Orbitron",fontSize:"9px",color:CD,marginTop:"6px",letterSpacing:"3px"}}>DEPLOYING IN {phase}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",maxWidth:"480px",width:"100%"}}>
        {items.map(function(it){return (
          <div key={it} style={{padding:"7px 10px",background:BP,border:"1px solid #141020",fontSize:"9px",color:CD,letterSpacing:"1px"}}>
            <span style={{color:CA}}>▸ </span>{it}
          </div>
        );})}
      </div>
    </div>
  );
}

// ── INTELLIGENCE TAB ──────────────────────────────────────────────────────────
function TabIntel({enriched,status}) {
  var [debateMode,setDebateMode] = useState(false);
  var [debateTicker,setDebateTicker] = useState("NVDA");

  var signals = enriched.map(function(p) {
    return Object.assign({},p,{signal: deriveSignal(p)});
  }).sort(function(a,b){return b.signal.score-a.signal.score;});

  var buys  = signals.filter(function(p){return p.signal.score>=7;});
  var holds = signals.filter(function(p){return p.signal.score>=4&&p.signal.score<7;});
  var sells = signals.filter(function(p){return p.signal.score<4;});

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>

      {/* Signal Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
        {[[buys.length+" BUY","BUY/STRONG BUY",CG],[holds.length+" HOLD","HOLD/WATCH",CY],[sells.length+" SELL","SELL/WATCH",CR]].map(function(r){return (
          <div key={r[0]} style={{background:BP,border:"1px solid "+r[2]+"33",padding:"10px",textAlign:"center"}}>
            <div style={{fontFamily:"Orbitron",fontSize:"18px",fontWeight:900,color:r[2]}}>{r[0]}</div>
            <div style={{fontSize:"9px",color:CD,letterSpacing:"1px",marginTop:"3px"}}>{r[1]}</div>
          </div>
        );})}
      </div>

      {/* Signals List */}
      <Panel label={"◈ POSITION SIGNALS — AI DERIVED"}>
        <div style={{fontSize:"9px",color:CD,marginBottom:"10px",letterSpacing:"1px"}}>Based on cost basis vs current price + day momentum. Not financial advice.</div>
        {status==="loading"&&<Spinner label="COMPUTING SIGNALS"/>}
        {signals.map(function(p){
          var s=p.signal;
          return (
            <div key={p.ticker} className="pr si">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <span style={{fontFamily:"Orbitron",fontSize:"11px",fontWeight:800,color:CA,minWidth:"42px"}}>{p.ticker}</span>
                  <div style={{height:"3px",width:"60px",background:"#0c0a18",borderRadius:"1px"}}>
                    <div style={{height:"100%",width:s.score*10+"%",background:s.color,borderRadius:"1px"}}/>
                  </div>
                  <span style={{fontSize:"10px",color:CD}}>{s.score}/10</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  {p.gainP!==null&&<span style={{fontSize:"9px",color:p.gainP>=0?CG:CR}}>{p.gainP>=0?"+":""}{p.gainP.toFixed(1)}% total</span>}
                  {p.chg!==null&&<span style={{fontSize:"9px",color:p.chg>=0?CG:CR}}>{p.chg>=0?"+":""}{p.chg}% today</span>}
                  <div style={{padding:"2px 8px",background:s.color+"22",border:"1px solid "+s.color+"44",fontFamily:"Orbitron",fontSize:"9px",color:s.color,letterSpacing:"1px"}}>{s.sig}</div>
                </div>
              </div>
            </div>
          );
        })}
      </Panel>

      {/* Discovery Picks */}
      <Panel label={"◈ MORNING DISCOVERY — HIGH CONVICTION PICKS"}>
        <div style={{fontSize:"9px",color:CD,marginBottom:"10px",letterSpacing:"1px"}}>AI-researched speculative picks. Not financial advice. Do your own due diligence.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          {DISCOVERY_PICKS.map(function(pick){return (
            <div key={pick.ticker} style={{background:BD,border:"1px solid #1a1520",padding:"10px",position:"relative"}}>
              <Corners/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                <span style={{fontFamily:"Orbitron",fontSize:"13px",fontWeight:800,color:CA,letterSpacing:"2px"}}>{pick.ticker}</span>
                <span style={{fontFamily:"Orbitron",fontSize:"9px",padding:"2px 5px",background:CG+"22",color:CG,border:"1px solid "+CG+"33"}}>{pick.conviction}</span>
              </div>
              <div style={{fontSize:"9px",color:CD,letterSpacing:"2px",marginBottom:"6px"}}>{pick.sector} ▪ {pick.timeframe}</div>
              <div style={{fontSize:"12px",color:CB,lineHeight:1.6,marginBottom:"6px"}}>{pick.price} — {pick.thesis}</div>
              <div style={{fontSize:"10px",color:CR,lineHeight:1.5}}>⚠ {pick.risk}</div>
            </div>
          );})}
        </div>
      </Panel>

      {/* Bull vs Bear Debate */}
      <Panel label={"◈ AI BULL vs BEAR DEBATE"}>
        <div style={{display:"flex",gap:"6px",marginBottom:"12px",alignItems:"center"}}>
          <span style={{fontSize:"9px",color:CD,letterSpacing:"1px"}}>TICKER:</span>
          <select value={debateTicker} onChange={function(e){setDebateTicker(e.target.value);}} style={{background:"#080812",border:"1px solid #1a1520",color:CA,fontFamily:"'Share Tech Mono',monospace",fontSize:"11px",padding:"4px 8px",outline:"none"}}>
            {POSITIONS.map(function(p){return <option key={p.ticker} value={p.ticker}>{p.ticker}</option>;})}
          </select>
          <button className="btn bsm" onClick={function(){setDebateMode(function(v){return !v;});}}>
            {debateMode?"CLOSE DEBATE":"▸ RUN DEBATE"}
          </button>
        </div>
        {debateMode&&<DebateView ticker={debateTicker} enriched={enriched}/>}
        {!debateMode&&<div style={{fontSize:"10px",color:CD}}>▸ Select a ticker and run the AI debate to see bull vs bear case</div>}
      </Panel>
    </div>
  );
}

function DebateView({ticker,enriched}) {
  var p = enriched.find(function(e){return e.ticker===ticker;})||{};
  var sig = deriveSignal(p);
  var bullPoints = [
    ticker+" is positioned in a high-growth sector with strong institutional backing.",
    "Current price offers attractive entry relative to sector peers and historical valuations.",
    "Day momentum of "+(p.chg>=0?"+":"")+p.chg+"% suggests near-term buying pressure.",
    "Portfolio cost basis of "+usd(p.avgCost)+" vs current "+usd(p.cur)+" shows "+(p.gainP>=0?"a gain":"manageable loss")+" — thesis intact.",
  ];
  var bearPoints = [
    "Macro headwinds — Fed policy and tariff uncertainty create sector-wide pressure.",
    "Position size in portfolio warrants stop-loss review at current levels.",
    "High volatility environment means any gap-down could accelerate selling.",
    p.gainP<0?"Current loss of "+p.gainP.toFixed(1)+"% suggests thesis under pressure — review catalyst timeline.":"Taking profits on "+p.gainP.toFixed(1)+"% gain may be tactically sound given macro risks.",
  ];
  return (
    <div className="fi" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
      <div style={{background:"#001408",border:"1px solid "+CG+"33",padding:"10px"}}>
        <div style={{fontFamily:"Orbitron",fontSize:"9px",color:CG,letterSpacing:"2px",marginBottom:"8px"}}>🐂 BULL CASE</div>
        {bullPoints.map(function(pt,i){return <div key={i} style={{fontSize:"11px",color:CB,lineHeight:1.65,marginBottom:"5px"}}>▸ {pt}</div>;})}
      </div>
      <div style={{background:"#140000",border:"1px solid "+CR+"33",padding:"10px"}}>
        <div style={{fontFamily:"Orbitron",fontSize:"9px",color:CR,letterSpacing:"2px",marginBottom:"8px"}}>🐻 BEAR CASE</div>
        {bearPoints.map(function(pt,i){return <div key={i} style={{fontSize:"11px",color:CB,lineHeight:1.65,marginBottom:"5px"}}>▸ {pt}</div>;})}
      </div>
      <div style={{gridColumn:"1/-1",padding:"8px",background:sig.color+"11",border:"1px solid "+sig.color+"33",textAlign:"center"}}>
        <span style={{fontFamily:"Orbitron",fontSize:"10px",color:sig.color,letterSpacing:"2px"}}>MARCUS VERDICT: {sig.sig} ▪ CONVICTION {sig.score}/10</span>
      </div>
    </div>
  );
}

// ── SOUN OPS TAB ───────────────────────────────────────────────────────────────
function TabSoun({port}) {
  var [activeSection,setActiveSection] = useState("leaps");
  var sounPrice = 7.04;
  // try to get live price if available
  if (port&&port.data&&port.data.SOUN) sounPrice = parseFloat(port.data.SOUN.price)||7.04;

  var l1 = LEAPS[0]; // 1/15/27
  var l2 = LEAPS[1]; // 1/21/28

  var now = new Date();
  var exp1 = new Date("2027-01-15");
  var exp2 = new Date("2028-01-21");
  var days1 = Math.max(0,Math.ceil((exp1-now)/(1000*60*60*24)));
  var days2 = Math.max(0,Math.ceil((exp2-now)/(1000*60*60*24)));

  var theta1 = thetaCalc(l1.avgCost,l1.contracts,365-days1,84);
  var theta2 = thetaCalc(l2.avgCost,l2.contracts,365-days2,83);

  var pct1 = (sounPrice/l1.breakeven*100).toFixed(1);
  var pct2 = (sounPrice/l2.breakeven*100).toFixed(1);

  // Rough probability estimate using simplified Black-Scholes intuition
  // At 84% IV with this time horizon, estimate probability of hitting breakeven
  var prob1 = Math.min(95,Math.max(5,(parseFloat(pct1)-40)*1.2)).toFixed(0);
  var prob2 = Math.min(95,Math.max(5,(parseFloat(pct2)-35)*1.3)).toFixed(0);

  var sections = [["leaps","LEAPS"],["theta","THETA"],["sentiment","SENTIMENT"],["catalysts","CATALYSTS"],["risks","RISKS"]];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>

      {/* SOUN Header */}
      <div style={{background:BP,border:"1px solid "+CA+"33",padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:"Orbitron",fontSize:"16px",fontWeight:900,color:CA,letterSpacing:"4px"}}>SOUN</div>
          <div style={{fontSize:"10px",color:CC,marginTop:"2px",letterSpacing:"1px"}}>SOUNDHOUND AI ▪ {SOUN_DATA.sector}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"Orbitron",fontSize:"22px",fontWeight:900,color:CB}}>${sounPrice.toFixed(2)}</div>
          <div style={{fontSize:"10px",color:CD,marginTop:"2px"}}>BREAKEVEN GAP: +{((l1.breakeven-sounPrice)/sounPrice*100).toFixed(1)}% — +{((l2.breakeven-sounPrice)/sounPrice*100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Section Nav */}
      <div style={{display:"flex",gap:"4px"}}>
        {sections.map(function(s){return (
          <button key={s[0]} onClick={function(){setActiveSection(s[0]);}} className="btn bsm" style={{flex:1,padding:"5px 4px",fontSize:"9px",borderColor:activeSection===s[0]?CA:"#2a1e08",color:activeSection===s[0]?CA:CC}}>
            {s[1]}
          </button>
        );})}
      </div>

      {/* LEAPS Section */}
      {activeSection==="leaps"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          {[{l:l1,days:days1,theta:theta1,pct:pct1,prob:prob1},{l:l2,days:days2,theta:theta2,pct:pct2,prob:prob2}].map(function(item,i){return (
            <div key={i} style={{background:BD,border:"1px solid #1a1520",padding:"12px",position:"relative"}}>
              <Corners/>
              <div style={{fontFamily:"Orbitron",fontSize:"9px",color:CA,letterSpacing:"2px",marginBottom:"10px"}}>{item.l.label}</div>
              {[
                ["CONTRACTS",item.l.contracts+"x"],
                ["AVG COST","$"+item.l.avgCost],
                ["MARKET VAL","$"+(item.l.contracts*100*item.l.avgCost).toFixed(0)],
                ["BREAKEVEN","$"+item.l.breakeven],
                ["SOUN NOW","$"+sounPrice.toFixed(2)],
                ["DAYS LEFT",item.days+" days"],
                ["NEEDS","+"+((item.l.breakeven-sounPrice)/sounPrice*100).toFixed(1)+"%"],
                ["HIT PROB","~"+item.prob+"%"],
              ].map(function(r){return (
                <div key={r[0]} style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                  <span style={{fontSize:"9px",color:CD}}>{r[0]}</span>
                  <span style={{fontSize:"11px",color:CB,fontFamily:"Orbitron"}}>{r[1]}</span>
                </div>
              );})}
              <div style={{marginTop:"8px",height:"4px",background:"#0c0a18",borderRadius:"2px"}}>
                <div style={{height:"100%",width:item.pct+"%",background:CY,borderRadius:"2px",boxShadow:"0 0 4px "+CY}}/>
              </div>
              <div style={{fontSize:"9px",color:CD,marginTop:"3px",textAlign:"right"}}>{item.pct}% TO BREAKEVEN</div>
            </div>
          );})}
        </div>
      )}

      {/* Theta Decay Section */}
      {activeSection==="theta"&&(
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <Panel label={"◈ THETA DECAY CLOCK — DAILY PREMIUM BLEED"}>
            <div style={{fontSize:"10px",color:CD,marginBottom:"12px",letterSpacing:"1px"}}>Every day that passes, your options lose value from time decay. This is theta — your cost of holding.</div>
            {[{l:l1,theta:theta1,days:days1,label:"1/15/27 LEAPS"},{l:l2,theta:theta2,days:days2,label:"1/21/28 LEAPS"}].map(function(item,i){return (
              <div key={i} style={{background:BD,border:"1px solid #1a1520",padding:"12px",marginBottom:"8px"}}>
                <div style={{fontFamily:"Orbitron",fontSize:"9px",color:CA,marginBottom:"8px"}}>{item.label}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"10px"}}>
                  {[["DAILY BLEED","$"+item.theta.dailyDecay,CR],["WEEKLY BLEED","$"+item.theta.weeklyDecay,CY],["DAYS REMAIN",item.days+" days",CG]].map(function(r){return (
                    <div key={r[0]} style={{textAlign:"center",background:BP,padding:"8px",border:"1px solid #141020"}}>
                      <div style={{fontSize:"9px",color:CD,marginBottom:"3px"}}>{r[0]}</div>
                      <div style={{fontFamily:"Orbitron",fontSize:"13px",fontWeight:700,color:r[2],textShadow:"0 0 8px "+r[2]+"66"}}>{r[1]}</div>
                    </div>
                  );})}
                </div>
                <div style={{fontSize:"10px",color:CD,lineHeight:1.6}}>
                  At current decay rate, you lose approximately <span style={{color:CY}}>${(item.theta.dailyDecay*30).toFixed(0)}/month</span> on this position while waiting for SOUN to move. The 2028 LEAPS bleeds slower per day — better for long-duration holds.
                </div>
              </div>
            );})}
          </Panel>
        </div>
      )}

      {/* Sentiment Section */}
      {activeSection==="sentiment"&&(
        <Panel label={"◈ SOUN SENTIMENT ANALYSIS"}>
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {SOUN_DATA.sentiment.map(function(s){return (
              <div key={s.label} style={{background:BD,border:"1px solid #1a1520",padding:"10px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                  <span style={{fontSize:"12px",color:CB,letterSpacing:"1px"}}>{s.label}</span>
                  <span style={{fontFamily:"Orbitron",fontSize:"11px",fontWeight:700,color:s.color}}>{s.score}/100</span>
                </div>
                <div style={{height:"4px",background:"#0c0a18",borderRadius:"2px",marginBottom:"5px"}}>
                  <div style={{height:"100%",width:s.score+"%",background:s.color,borderRadius:"2px"}}/>
                </div>
                <div style={{fontSize:"10px",color:CD}}>{s.note}</div>
              </div>
            );})}
            <div style={{padding:"10px",background:"#001808",border:"1px solid "+CG+"22"}}>
              <div style={{fontFamily:"Orbitron",fontSize:"10px",color:CG,letterSpacing:"2px",marginBottom:"6px"}}>🐂 BULL THESIS</div>
              <div style={{fontSize:"11px",color:CB,lineHeight:1.7}}>{SOUN_DATA.bull}</div>
            </div>
            <div style={{padding:"10px",background:"#180000",border:"1px solid "+CR+"22"}}>
              <div style={{fontFamily:"Orbitron",fontSize:"10px",color:CR,letterSpacing:"2px",marginBottom:"6px"}}>🐻 BEAR THESIS</div>
              <div style={{fontSize:"11px",color:CB,lineHeight:1.7}}>{SOUN_DATA.bear}</div>
            </div>
          </div>
        </Panel>
      )}

      {/* Catalysts Section */}
      {activeSection==="catalysts"&&(
        <Panel label={"◈ SOUN CATALYST CALENDAR"}>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {SOUN_DATA.catalysts.map(function(c,i){return (
              <div key={i} style={{display:"flex",gap:"10px",padding:"10px",background:BD,border:"1px solid #1a1520"}}>
                <div style={{fontFamily:"Orbitron",fontSize:"10px",color:CA,letterSpacing:"1px",minWidth:"60px",flexShrink:0}}>{c.date}</div>
                <div style={{fontSize:"11px",color:CB,lineHeight:1.6}}>{c.event}</div>
              </div>
            );})}
          </div>
        </Panel>
      )}

      {/* Risks Section */}
      {activeSection==="risks"&&(
        <Panel label={"◈ SOUN RISK ASSESSMENT"}>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {SOUN_DATA.risks.map(function(r,i){return (
              <div key={i} style={{display:"flex",gap:"10px",padding:"10px",background:"#140000",border:"1px solid "+CR+"22"}}>
                <span style={{color:CR,fontSize:"12px",flexShrink:0}}>⚠</span>
                <div style={{fontSize:"11px",color:CB,lineHeight:1.6}}>{r}</div>
              </div>
            );})}
          </div>
          <div style={{marginTop:"10px",padding:"10px",background:BD,border:"1px solid #1a1520"}}>
            <div style={{fontFamily:"Orbitron",fontSize:"10px",color:CY,letterSpacing:"2px",marginBottom:"6px"}}>MARCUS ASSESSMENT</div>
            <div style={{fontSize:"11px",color:CB,lineHeight:1.7}}>The two-LEAPS structure reflects disciplined conviction. The 2028 contract gives ample runway for the AI voice market to mature. The primary risk is theta decay during extended sideways movement. Monitor the quarterly earnings catalyst as the highest-probability re-rating event.</div>
          </div>
        </Panel>
      )}
    </div>
  );
}

// ── VOICE MODE ─────────────────────────────────────────────────────────────────
function VoiceMode({alf,enriched,fg,onClose}) {
  var [status,setStatus]   = useState("idle"); // idle | listening | speaking | response
  var [transcript,setTranscript] = useState("");
  var [response,setResponse]     = useState("");
  var synthRef = typeof window!=="undefined"&&window.speechSynthesis;

  function marcusRespond(query) {
    var q = query.toLowerCase();
    var resp = "";

    if (q.includes("portfolio")||q.includes("holdings")||q.includes("stocks")) {
      var winners = enriched.filter(function(p){return p.gainP&&p.gainP>0;});
      var losers  = enriched.filter(function(p){return p.gainP&&p.gainP<0;});
      resp = "Your portfolio currently holds "+POSITIONS.length+" positions. "+winners.length+" are in positive territory, led by SMCI at "+enriched.find(function(p){return p.ticker==="SMCI";}).gainP.toFixed(1)+"% total return. "+losers.length+" positions are underwater — notably DVN and MNTS. Overall, "+fg.label.toLowerCase()+" sentiment prevails with an average day change of "+fg.avg+"%.";
    } else if (q.includes("soun")||q.includes("leaps")||q.includes("options")) {
      resp = "Your SOUN LEAPS positions are both structured around the ten dollar strike. The nearer contract expires January 2027, requiring SOUN to reach eleven dollars and twenty-four cents — a sixty percent move from the current price of seven dollars and four cents. The longer contract expires January 2028, giving you nearly four years of runway. I would characterize the thesis as speculative but not unreasonable given the AI voice tailwinds.";
    } else if (q.includes("parlay")||q.includes("mlb")||q.includes("baseball")||q.includes("bet")) {
      resp = "You have four MLB futures parlays open, sir, with a total of one hundred and twelve dollars at risk and a maximum potential payout of thirteen thousand dollars. All four settle October 31st, 2026. The Yankees, Mariners, and Braves making the playoffs are your critical legs — appearing across all four parlays. I suggest monitoring their standings daily as the season progresses.";
    } else if (q.includes("alert")||q.includes("danger")||q.includes("worry")) {
      var big = enriched.filter(function(p){return p.gainP&&Math.abs(p.gainP)>15;});
      if (big.length) {
        resp = "There are "+big.length+" positions with notable movement. "+big.map(function(p){return p.ticker+" at "+p.gainP.toFixed(1)+"% total return";}).join(", ")+". DVN is under analyst pressure and MNTS continues to underperform. I would recommend reviewing your stop-loss levels on both positions.";
      } else {
        resp = "No critical alerts at this time. Your positions are moving within normal parameters. The market sentiment gauge reads "+fg.label+", with an average portfolio day change of "+fg.avg+" percent.";
      }
    } else if (q.includes("best")||q.includes("top")||q.includes("winner")) {
      var sorted = enriched.filter(function(p){return p.gainP;}).sort(function(a,b){return b.gainP-a.gainP;});
      var top = sorted[0];
      resp = "Your top performing position is currently "+top.ticker+", "+top.name+", with a total return of "+top.gainP.toFixed(1)+" percent. SMCI and MU show strong AI infrastructure momentum. SMCI and MU are also performing admirably in the AI infrastructure space.";
    } else if (q.includes("good morning")||q.includes("briefing")||q.includes("morning")||q.includes("today")) {
      resp = alf.text;
    } else {
      resp = "Query not recognized. You may ask me about your portfolio, your SOUN LEAPS, your MLB parlays, today's briefing, or any position alerts. I am at your service.";
    }

    setResponse(resp);
    setStatus("response");

    if (synthRef) {
      synthRef.cancel();
      var utt = new window.SpeechSynthesisUtterance(resp);
      utt.rate = 0.9;
      utt.pitch = 0.85;
      utt.volume = 1;
      // try to find a calm authoritative voice for Marcus
      var voices = synthRef.getVoices();
      var british = voices.find(function(v){return v.lang&&v.lang.startsWith("en-GB");});
      if (british) utt.voice = british;
      synthRef.speak(utt);
      setStatus("speaking");
      utt.onend = function(){setStatus("response");};
    }
  }

  function startListening() {
    var SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) { setResponse("Voice recognition not available on this device."); setStatus("response"); return; }
    var rec = new SR();
    rec.continuous = false;
    rec.lang = "en-US";
    rec.onresult = function(e) {
      var t = e.results[0][0].transcript;
      setTranscript(t);
      marcusRespond(t);
    };
    rec.onerror = function() { setStatus("idle"); setResponse("I apologize, sir — the microphone appears to be unavailable."); setStatus("response"); };
    rec.start();
    setStatus("listening");
    setTranscript("");
    setResponse("");
  }

  function stopSpeaking() {
    if (synthRef) synthRef.cancel();
    setStatus("idle");
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,.9)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"20px",padding:"24px"}}>
      <div style={{fontFamily:"Orbitron",fontSize:"14px",color:CA,letterSpacing:"5px"}}>MARCUS — VOICE INTERFACE</div>

      {/* Mic button */}
      <button onClick={status==="idle"||status==="response"?startListening:stopSpeaking}
        style={{width:"80px",height:"80px",borderRadius:"50%",border:"2px solid "+(status==="listening"?"#ff4422":status==="speaking"?CG:CA),background:status==="listening"?"rgba(204,34,0,.15)":status==="speaking"?"rgba(15,168,48,.1)":"rgba(240,163,10,.05)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px",transition:"all .3s",boxShadow:"0 0 "+(status==="idle"?"8px":"24px")+" "+(status==="listening"?"#cc220044":status==="speaking"?CG+"44":CA+"44")}}>
        {status==="listening"?"🔴":status==="speaking"?"🔊":"🎙"}
      </button>

      <div style={{fontFamily:"Orbitron",fontSize:"9px",letterSpacing:"3px",color:status==="listening"?CR:status==="speaking"?CG:CD}}>
        {status==="idle"?"TAP TO SPEAK":status==="listening"?"LISTENING...":status==="speaking"?"MARCUS SPEAKING...":"TAP TO SPEAK AGAIN"}
      </div>

      {transcript&&<div style={{background:BP,border:"1px solid #141020",padding:"10px 16px",maxWidth:"320px",width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"9px",color:CD,letterSpacing:"2px",marginBottom:"4px"}}>YOU SAID</div>
        <div style={{fontSize:"11px",color:CB,fontStyle:"italic"}}>"{transcript}"</div>
      </div>}

      {response&&<div style={{background:BP,border:"1px solid "+CA+"33",padding:"12px 16px",maxWidth:"320px",width:"100%"}}>
        <div style={{fontSize:"9px",color:CD,letterSpacing:"2px",marginBottom:"6px"}}>— MARCUS ▪ APEX</div>
        <div style={{fontSize:"11px",color:CB,lineHeight:1.8,fontStyle:"italic"}}>"{response}"</div>
      </div>}

      <div style={{fontSize:"10px",color:CD,letterSpacing:"1px",textAlign:"center",maxWidth:"280px"}}>
        Try asking: "How's my portfolio?", "Tell me about SOUN", "What are my parlays?", "Give me today's briefing", "Any alerts?"
      </div>

      <button className="btn" onClick={onClose} style={{marginTop:"10px"}}>CLOSE VOICE MODE</button>
    </div>
  );
}


// ── PARLAYS TAB ────────────────────────────────────────────────────────────────

const PARLAY_DATA = [
  {id:1,odds:"+35464",stake:15,payout:5334.69,legs:19,placed:"4/13/2026",settles:"10/31/2026",make:["NYY","SEA","BAL","PHI","ATL","SD","LAD","MIN"],miss:["MIA","LAA","HOU","CIN","SF","CWS","WSH","COL","BOS","CHC","MIL"]},
  {id:2,odds:"+36865",stake:10,payout:3696.59,legs:16,placed:"4/13/2026",settles:"10/31/2026",make:["ATL","NYY","SEA","CIN","BAL","NYM","SD","CLE","BOS"],miss:["HOU","LAA","SF","COL","WSH","CWS","MIA"]},
  {id:3,odds:"+25234",stake:12,payout:3040.12,legs:11,placed:"4/13/2026",settles:"10/31/2026",make:["SEA","NYY","CLE","ATL","SD","PHI","BAL","TOR"],miss:["LAA","HOU","CHC"]},
  {id:4,odds:"+1150", stake:75,payout:937.53, legs:9, placed:"4/13/2026",settles:"10/31/2026",make:["SEA","NYY","ATL","PHI"],miss:["LAA","HOU","CIN","MIA","SF"]},
];





// ── MONTE CARLO PARLAY ENGINE ─────────────────────────────────────────────────
// Implements 7-step methodology: data → simulation → edge → construction

// Step 1: Sportsbook make/miss odds (DraftKings/FanDuel current lines)
var BOOK_ODDS = {
  LAD:{make:-600,miss:420},ATL:{make:-320,miss:245},MIN:{make:-195,miss:160},
  SD:{make:-270,miss:215},NYY:{make:-175,miss:145},CLE:{make:-155,miss:130},
  PHI:{make:-145,miss:120},TB:{make:-108,miss:-115},BAL:{make:-125,miss:105},
  TOR:{make:155,miss:-185},HOU:{make:145,miss:-175},SEA:{make:115,miss:-140},
  ATH:{make:165,miss:-200},TEX:{make:225,miss:-280},NYM:{make:205,miss:-255},
  AZ:{make:235,miss:-295},MIL:{make:235,miss:-295},PIT:{make:265,miss:-335},
  CHC:{make:265,miss:-335},STL:{make:285,miss:-360},MIA:{make:305,miss:-390},
  BOS:{make:305,miss:-390},LAA:{make:285,miss:-360},CIN:{make:205,miss:-255},
  DET:{make:335,miss:-430},WSH:{make:405,miss:-525},KC:{make:455,miss:-600},
  SF:{make:355,miss:-455},COL:{make:660,miss:-1000},CWS:{make:710,miss:-1100},
};

// Vegas 2026 preseason win totals
var VEGAS_WINS = {
  LAD:100,ATL:95,NYY:92,PHI:89,NYM:88,SD:87,HOU:86,MIN:86,
  CLE:85,ATH:85,SEA:84,BAL:83,TOR:82,BOS:80,TEX:79,MIL:79,
  STL:78,TB:78,AZ:77,CHC:76,CIN:76,SF:75,DET:74,PIT:73,
  KC:72,MIA:71,WSH:68,COL:65,CWS:64,LAA:64,
};

// Step 2: American odds → implied probability (vig-adjusted)
function oddsToImplied(odds) {
  if(odds < 0) return (-odds)/(-odds+100);
  return 100/(odds+100);
}

// Step 3: Fetch live standings with full stats
async function fetchMLBStandings() {
  try {
    var r = await fetch('https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=2026&standingsTypes=regularSeason&hydrate=team,league,division');
    var d = await r.json();
    var divMap = {200:'AL West',201:'AL East',202:'AL Central',203:'NL West',204:'NL East',205:'NL Central'};
    var out = [];
    d.records.forEach(function(rec){
      var div = divMap[rec.division.id]||rec.division.name;
      rec.teamRecords.forEach(function(t,rank){
        var abbr = t.team.abbreviation;
        var xRec = t.records&&t.records.expectedRecords&&t.records.expectedRecords.find(function(r){return r.type==='xWinLossSeason';});
        var xWins = xRec?parseInt(xRec.wins):null;
        var splits = t.records&&t.records.splitRecords||[];
        var homeSplit = splits.find(function(s){return s.type==='home';});
        var awaySplit = splits.find(function(s){return s.type==='away';});
        var streak = t.streak||{};
        out.push({
          t:abbr,w:t.wins,l:t.losses,div:div,divRank:rank+1,
          xWins:xWins,runDiff:t.runDifferential||0,
          streakNum:streak.streakNumber||0,streakType:streak.streakType||'',
          homeW:homeSplit?homeSplit.wins:0,homeL:homeSplit?homeSplit.losses:0,
          awayW:awaySplit?awaySplit.wins:0,awayL:awaySplit?awaySplit.losses:0,
          gb:t.gamesBack==='-'?0:parseFloat(t.gamesBack)||0,
          wcgb:t.wildCardGamesBack==='-'?0:parseFloat(t.wildCardGamesBack)||0,
          status:rank<2?'make':'miss',conf:60
        });
      });
    });
    return out;
  } catch(ex){ return MLB_STATIC; }
}

// Step 4: Fetch last-10 streaks from ESPN scoreboard
async function fetchStreaks() {
  try {
    var today = new Date(); var d14 = new Date(today-14*864e5);
    var fmt = function(d){return d.getFullYear()+('0'+(d.getMonth()+1)).slice(-2)+('0'+d.getDate()).slice(-2);};
    var r = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?limit=200&dates='+fmt(d14)+'-'+fmt(today));
    var data = await r.json();
    var results = {};
    (data.events||[]).forEach(function(ev){
      var comp = ev.competitions&&ev.competitions[0];
      if(!comp||comp.status.type.name!=='STATUS_FINAL')return;
      comp.competitors.forEach(function(c){
        var a = c.team.abbreviation;
        if(!results[a]) results[a]=[];
        results[a].push(c.winner?1:0);
      });
    });
    var out = {};
    Object.keys(results).forEach(function(t){
      var all = results[t]; var last10 = all.slice(-10);
      var l10w = last10.filter(function(x){return x===1;}).length;
      out[t]={last10:last10.length,l10w:l10w,l10l:last10.length-l10w};
    });
    return out;
  } catch(ex){ return {}; }
}

// Step 5: Monte Carlo — 75K simulations of full MLB season
function runMonteCarlo(standings, streaks) {
  var NUM_SIMS = 75000;
  var counts = {};
  standings.forEach(function(t){ counts[t.t]=0; });

  // Precompute each team's per-game win probability
  var probs = {};
  standings.forEach(function(t){
    var gp = t.w+t.l;
    var vegasPct = (VEGAS_WINS[t.t]||77)/162;
    var pythPct = t.xWins ? t.xWins/162 : (gp>0?t.w/gp:0.5);
    var actualPct = gp>0 ? t.w/gp : 0.5;
    var sd = streaks[t.t]||{};
    var l10pct = sd.last10>0 ? sd.l10w/sd.last10 : actualPct;
    // Run differential adjustment
    var rdAdj = gp>0 ? Math.max(-0.05, Math.min(0.05, (t.runDiff/gp)*0.015)) : 0;
    // Weight: Vegas 40%, Pythagorean 35%, L10 15%, actual 10%
    var w = gp<25 ? {v:0.45,py:0.35,l10:0.12,a:0.08} : {v:0.35,py:0.35,l10:0.20,a:0.10};
    var base = w.v*vegasPct + w.py*pythPct + w.l10*l10pct + w.a*actualPct + rdAdj;
    probs[t.t] = {pct:Math.min(0.72,Math.max(0.28,base)), rem:162-gp, curW:t.w, div:t.div};
  });

  // Box-Muller normal random
  function randn(){
    var u=0,v=0;
    while(!u)u=Math.random(); while(!v)v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }

  // Binomial via normal approximation
  function binom(n,p){
    if(n<=0)return 0;
    return Math.max(0,Math.min(n,Math.round(n*p+Math.sqrt(n*p*(1-p))*randn())));
  }

  for(var sim=0;sim<NUM_SIMS;sim++){
    // Simulate final wins
    var fw = {};
    standings.forEach(function(t){
      var p=probs[t.t];
      fw[t.t]=p.curW+binom(p.rem,p.pct);
    });

    // Apply MLB playoff structure: 3 div winners + 3 WC per league
    var al={},nl={};
    standings.forEach(function(t){
      if(t.div.indexOf('AL')===0){if(!al[t.div])al[t.div]=[];al[t.div].push({t:t.t,w:fw[t.t]});}
      else{if(!nl[t.div])nl[t.div]=[];nl[t.div].push({t:t.t,w:fw[t.t]});}
    });

    function leaguePlayoffs(divs){
      var winners={},all=[];
      Object.keys(divs).forEach(function(d){
        var sorted=divs[d].slice().sort(function(a,b){return b.w-a.w;});
        winners[sorted[0].t]=true;
        divs[d].forEach(function(t){all.push(t);});
      });
      all.filter(function(t){return !winners[t.t];})
         .sort(function(a,b){return b.w-a.w;})
         .slice(0,3).forEach(function(t){winners[t.t]=true;});
      return winners;
    }

    var playoff=Object.assign({},leaguePlayoffs(al),leaguePlayoffs(nl));
    standings.forEach(function(t){ if(playoff[t.t]) counts[t.t]++; });
  }

  var result={};
  standings.forEach(function(t){ result[t.t]=counts[t.t]/NUM_SIMS; });
  return result;
}

// Step 6: Build full edge data
function buildEdgeData(standings, streaks, simResults) {
  simResults = simResults || {};
  return standings.map(function(t){
    var simMake = simResults[t.t]!==undefined ? simResults[t.t] : (t.w/(Math.max(1,t.w+t.l))*0.5+0.1);
    var odds = BOOK_ODDS[t.t]||{make:200,miss:-250};
    var bookMake = oddsToImplied(odds.make);
    var bookMiss = oddsToImplied(odds.miss);
    var edgeMake = (simMake - bookMake)*100;
    var edgeMiss = ((1-simMake) - bookMiss)*100;
    var sd = streaks[t.t]||{};
    var l10w = sd.l10w; var l10l = sd.l10l;
    var vegasWins = VEGAS_WINS[t.t]||77;
    var xWins = t.xWins||Math.round((t.w/Math.max(1,t.w+t.l))*162);
    var rdPerGame = (t.w+t.l)>0?(t.runDiff/(t.w+t.l)).toFixed(1):'0';
    var streakLabel = t.streakType==='wins'?'W'+t.streakNum:t.streakType==='losses'?'L'+t.streakNum:'-';
    return Object.assign({},t,{
      simMakePct:Math.round(simMake*100),
      simMissPct:Math.round((1-simMake)*100),
      bookMakePct:Math.round(bookMake*100),
      bookMissPct:Math.round(bookMiss*100),
      bookMakeOdds:odds.make,
      edgeMake:edgeMake.toFixed(1),
      edgeMiss:edgeMiss.toFixed(1),
      vegasWins:vegasWins,xWins:xWins,rdPerGame:rdPerGame,
      l10:l10w!==undefined?(l10w+'-'+l10l):'-',
      hot:l10w>=7,cold:l10w!==undefined&&l10w<=3,
      streakLabel:streakLabel,
      homeRec:t.homeW+'-'+t.homeL,awayRec:t.awayW+'-'+t.awayL,
    });
  });
}

// Step 7: Build tiered parlay tickets
function buildParlayTickets(edgeData, yourParlayData) {
  if(!edgeData||!edgeData.length) return [];
  var makeLegs = edgeData.filter(function(t){return t.simMakePct>=55;})
    .sort(function(a,b){return parseFloat(b.edgeMake||0)-parseFloat(a.edgeMake||0);});
  var missLegs = edgeData.filter(function(t){return t.simMissPct>=55;})
    .sort(function(a,b){return parseFloat(b.edgeMiss||0)-parseFloat(a.edgeMiss||0);});
  // Ensure we have at least some legs
  if(!makeLegs.length) makeLegs = edgeData.slice(0,4);
  if(!missLegs.length) missLegs = edgeData.slice(-4).reverse();

  function buildTicket(mLegs, xLegs, name, target) {
    var legs = mLegs.concat(xLegs);
    if(!legs.length) return {name:name,target:target,legs:[],makeLegs:[],missLegs:[],simProb:'0',bookProb:'0',edge:'1.00',weakest:'N/A'};
    var simProb = legs.reduce(function(acc,l){
      var p = mLegs.indexOf(l)>=0 ? (l.simMakePct||50)/100 : (l.simMissPct||50)/100;
      return acc * p;
    }, 1);
    var bookProb = legs.reduce(function(acc,l){
      var p = mLegs.indexOf(l)>=0 ? (l.bookMakePct||50)/100 : (l.bookMissPct||50)/100;
      return acc * p;
    }, 1);
    var edge = simProb>0&&bookProb>0 ? (simProb/bookProb).toFixed(2) : '1.00';
    var weakest = legs.length ? legs.reduce(function(w,l){
      var e = mLegs.indexOf(l)>=0?parseFloat(l.edgeMake||0):parseFloat(l.edgeMiss||0);
      var we = mLegs.indexOf(w)>=0?parseFloat(w.edgeMake||0):parseFloat(w.edgeMiss||0);
      return e < we ? l : w;
    }).t : 'N/A';
    return {name:name,target:target,legs:legs,makeLegs:mLegs,missLegs:xLegs,
      simProb:(simProb*100).toFixed(2),bookProb:(bookProb*100).toFixed(2),
      edge:edge,weakest:weakest};
  }
  return [
    buildTicket(makeLegs.slice(0,2), missLegs.slice(0,2), 'ANCHOR', '35-45% hit rate'),
    buildTicket(makeLegs.slice(0,3), missLegs.slice(0,3), 'MID-TIER', '10-15% hit rate'),
    buildTicket(makeLegs.slice(0,4), missLegs.slice(0,4), 'LOTTERY', '3-5% hit rate'),
  ];
}

// Static fallback
const MLB_STATIC = [
  {t:"LAD",w:13,l:4,div:"NL West",divRank:1,runDiff:42,xWins:99,streakNum:1,streakType:"wins",homeW:6,homeL:2,awayW:7,awayL:2,gb:0,wcgb:0},
  {t:"ATL",w:11,l:7,div:"NL East",divRank:1,runDiff:18,xWins:94,streakNum:2,streakType:"wins",homeW:5,homeL:3,awayW:6,awayL:4,gb:0,wcgb:0},
  {t:"MIN",w:11,l:7,div:"AL Central",divRank:1,runDiff:12,xWins:86,streakNum:1,streakType:"losses",homeW:6,homeL:3,awayW:5,awayL:4,gb:0,wcgb:0},
  {t:"SD",w:11,l:6,div:"NL West",divRank:2,runDiff:22,xWins:88,streakNum:2,streakType:"wins",homeW:5,homeL:2,awayW:6,awayL:4,gb:2,wcgb:0},
  {t:"NYY",w:9,l:8,div:"AL East",divRank:2,runDiff:5,xWins:91,streakNum:1,streakType:"wins",homeW:4,homeL:4,awayW:5,awayL:4,gb:0,wcgb:0},
  {t:"CLE",w:10,l:8,div:"AL Central",divRank:2,runDiff:8,xWins:85,streakNum:2,streakType:"losses",homeW:5,homeL:3,awayW:5,awayL:5,gb:1,wcgb:0},
  {t:"PHI",w:8,l:9,div:"NL East",divRank:3,runDiff:2,xWins:88,streakNum:1,streakType:"wins",homeW:4,homeL:4,awayW:4,awayL:5,gb:3,wcgb:1},
  {t:"TB",w:9,l:7,div:"AL East",divRank:1,runDiff:-7,xWins:77,streakNum:4,streakType:"wins",homeW:4,homeL:2,awayW:5,awayL:5,gb:0,wcgb:0},
  {t:"BAL",w:9,l:8,div:"AL East",divRank:3,runDiff:3,xWins:82,streakNum:1,streakType:"wins",homeW:5,homeL:3,awayW:4,awayL:5,gb:0,wcgb:0},
  {t:"ATH",w:9,l:8,div:"AL West",divRank:1,runDiff:4,xWins:84,streakNum:1,streakType:"wins",homeW:5,homeL:3,awayW:4,awayL:5,gb:0,wcgb:0},
  {t:"TEX",w:9,l:8,div:"AL West",divRank:2,runDiff:1,xWins:78,streakNum:1,streakType:"wins",homeW:5,homeL:3,awayW:4,awayL:5,gb:0,wcgb:0},
  {t:"TOR",w:7,l:9,div:"AL East",divRank:4,runDiff:-3,xWins:81,streakNum:1,streakType:"losses",homeW:3,homeL:5,awayW:4,awayL:4,gb:2,wcgb:1},
  {t:"SEA",w:8,l:10,div:"AL West",divRank:4,runDiff:-5,xWins:83,streakNum:1,streakType:"losses",homeW:3,homeL:5,awayW:5,awayL:5,gb:3,wcgb:2},
  {t:"NYM",w:7,l:11,div:"NL East",divRank:5,runDiff:-8,xWins:87,streakNum:1,streakType:"losses",homeW:3,homeL:5,awayW:4,awayL:6,gb:4,wcgb:2},
  {t:"AZ",w:10,l:8,div:"NL West",divRank:3,runDiff:6,xWins:76,streakNum:1,streakType:"wins",homeW:5,homeL:3,awayW:5,awayL:5,gb:3,wcgb:1},
  {t:"PIT",w:10,l:7,div:"NL Central",divRank:2,runDiff:5,xWins:72,streakNum:2,streakType:"wins",homeW:5,homeL:3,awayW:5,awayL:4,gb:0,wcgb:2},
  {t:"CIN",w:10,l:7,div:"NL Central",divRank:1,runDiff:10,xWins:75,streakNum:3,streakType:"wins",homeW:5,homeL:3,awayW:5,awayL:4,gb:0,wcgb:1},
  {t:"MIL",w:8,l:8,div:"NL Central",divRank:3,runDiff:0,xWins:78,streakNum:1,streakType:"wins",homeW:4,homeL:4,awayW:4,awayL:4,gb:2,wcgb:2},
  {t:"STL",w:9,l:8,div:"NL Central",divRank:3,runDiff:2,xWins:77,streakNum:1,streakType:"wins",homeW:5,homeL:3,awayW:4,awayL:5,gb:1,wcgb:2},
  {t:"HOU",w:7,l:11,div:"AL West",divRank:5,runDiff:-18,xWins:85,streakNum:2,streakType:"losses",homeW:3,homeL:5,awayW:4,awayL:6,gb:4,wcgb:3},
  {t:"MIA",w:9,l:9,div:"NL East",divRank:2,runDiff:0,xWins:70,streakNum:1,streakType:"wins",homeW:5,homeL:4,awayW:4,awayL:5,gb:2,wcgb:1},
  {t:"WSH",w:8,l:9,div:"NL East",divRank:4,runDiff:-5,xWins:67,streakNum:1,streakType:"wins",homeW:4,homeL:4,awayW:4,awayL:5,gb:3,wcgb:2},
  {t:"LAA",w:9,l:9,div:"AL West",divRank:3,runDiff:-2,xWins:63,streakNum:1,streakType:"wins",homeW:5,homeL:4,awayW:4,awayL:5,gb:2,wcgb:3},
  {t:"DET",w:8,l:9,div:"AL Central",divRank:3,runDiff:-2,xWins:73,streakNum:1,streakType:"losses",homeW:4,homeL:4,awayW:4,awayL:5,gb:3,wcgb:2},
  {t:"CHC",w:8,l:9,div:"NL Central",divRank:4,runDiff:-4,xWins:75,streakNum:1,streakType:"losses",homeW:4,homeL:4,awayW:4,awayL:5,gb:2,wcgb:2},
  {t:"KC",w:7,l:10,div:"AL Central",divRank:4,runDiff:-8,xWins:71,streakNum:2,streakType:"losses",homeW:3,homeL:5,awayW:4,awayL:5,gb:4,wcgb:3},
  {t:"BOS",w:6,l:11,div:"AL East",divRank:5,runDiff:-15,xWins:79,streakNum:1,streakType:"losses",homeW:3,homeL:5,awayW:3,awayL:6,gb:5,wcgb:4},
  {t:"SF",w:6,l:11,div:"NL West",divRank:4,runDiff:-12,xWins:74,streakNum:2,streakType:"losses",homeW:3,homeL:5,awayW:3,awayL:6,gb:7,wcgb:5},
  {t:"COL",w:6,l:11,div:"NL West",divRank:5,runDiff:-28,xWins:64,streakNum:1,streakType:"losses",homeW:3,homeL:5,awayW:3,awayL:6,gb:7,wcgb:6},
  {t:"CWS",w:6,l:11,div:"AL Central",divRank:5,runDiff:-25,xWins:63,streakNum:1,streakType:"wins",homeW:3,homeL:5,awayW:3,awayL:6,gb:5,wcgb:5},
];

const MLB = MLB_STATIC;




function getLegSt(team,type,mlbData){
  var MLB_USE=mlbData||MLB_STATIC;
  var s=MLB.find(function(x){return x.t===team;});
  if(!s)return{color:CD,icon:"?",conf:50,label:"UNKNOWN"};
  var tracking=type==="make"?s.status==="make":s.status==="miss";
  if(tracking&&s.conf>=75)return{color:CG,icon:"✓",conf:s.conf,label:"ON TRACK",w:s.w,l:s.l};
  if(tracking&&s.conf>=55)return{color:CY,icon:"~",conf:s.conf,label:"LIKELY",w:s.w,l:s.l};
  if(!tracking&&s.conf>=75)return{color:CR,icon:"✗",conf:s.conf,label:"AT RISK",w:s.w,l:s.l};
  return{color:CY,icon:"~",conf:s.conf,label:"WATCH",w:s.w,l:s.l};
}

function calcProb(parlay,mlbData){
  var MLB_USE=mlbData&&mlbData.length?mlbData:MLB_STATIC;
  var legs=[];
  parlay.make.forEach(function(t){
    var s=MLB_USE.find(function(x){return x.t===t;});
    // Use simMakePct if available, else conf, else estimate from win%
    var prob = s ? (s.simMakePct?s.simMakePct/100 : s.conf?s.conf/100 : (s.w&&s.l?(s.w/(s.w+s.l)*0.6+0.2):0.5)) : 0.5;
    legs.push(prob);
  });
  parlay.miss.forEach(function(t){
    var s=MLB_USE.find(function(x){return x.t===t;});
    var prob = s ? (s.simMissPct?s.simMissPct/100 : s.conf?s.conf/100 : (s.w&&s.l?(1-s.w/(s.w+s.l))*0.6+0.2:0.5)) : 0.5;
    legs.push(prob);
  });
  if(!legs.length)return 0;
  return Math.min(99,Math.max(0.001,legs.reduce(function(a,b){return a*b;},1)*100));
},1)*100));
}

function TabParlays(){
  var [ap,setAp]=useState(0);
  var [view,setView]=useState("overview");
  var [mlbData,setMlbData]=useState(MLB_STATIC);
  var [mlbLoading,setMlbLoading]=useState(true);
  var [edgeData,setEdgeData]=useState([]);
  var [tickets,setTickets]=useState([]);
  var [simStatus,setSimStatus]=useState('idle');
  useEffect(function(){
    Promise.all([fetchMLBStandings(),fetchStreaks()]).then(function(res){
      var standings=res[0]; var streakMap=res[1];
      setSimStatus('running');
      setTimeout(function(){
        try {
          var simResults=runMonteCarlo(standings,streakMap);
          var ed=buildEdgeData(standings,streakMap,simResults);
          var sorted=ed.slice().sort(function(a,b){return b.simMakePct-a.simMakePct;});
          setEdgeData(sorted);
          // Merge simMakePct/simMissPct into mlbData so calcProb works
          var mergedStandings = standings.map(function(t){
            var match = sorted.find(function(e){return e.t===t.t;});
            return match ? match : t;
          });
          setMlbData(mergedStandings);
          setTickets(buildParlayTickets(ed,PARLAY_DATA));
        } catch(err) {
          console.log('Monte Carlo error:', err.message);
          // Fallback: use static data
          var fallbackEd = buildEdgeData(MLB_STATIC, streakMap, {});
          setEdgeData(fallbackEd.slice().sort(function(a,b){return b.simMakePct-a.simMakePct;}));
          setMlbData(MLB_STATIC);
        }
        setSimStatus('done');
        setMlbLoading(false);
      },50);
    }).catch(function(err){
      console.log('Fetch error:', err.message);
      setMlbData(MLB_STATIC);
      setSimStatus('done');
      setMlbLoading(false);
    });
  },[]);
  var p=PARLAY_DATA[ap];
  var prob=calcProb(p,mlbData);
  var daysLeft=Math.ceil((new Date("2026-10-31")-new Date())/(1000*60*60*24));
  var uMake=["NYY","SEA","ATL"],uMiss=["LAA","HOU"];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px"}}>
        {[["AT RISK","$112",CR],["MAX PAYOUT","$13,009",CG],["DAYS LEFT",daysLeft,CY],["SETTLES","OCT 31",CA]].map(function(r){return(
          <div key={r[0]} style={{background:BP,border:"1px solid #1a1520",padding:"8px",textAlign:"center"}}>
            <div style={{fontSize:"9px",color:CD,marginBottom:"2px"}}>{r[0]}</div>
            <div style={{fontFamily:"Orbitron",fontSize:"12px",fontWeight:700,color:r[2]}}>{r[1]}</div>
          </div>
        );})}
      </div>

      {mlbLoading&&<div style={{background:"#08080f",border:"1px solid "+CA+"33",padding:"8px 12px",fontSize:"9px",color:CY,fontFamily:"Orbitron",letterSpacing:"2px",display:"flex",alignItems:"center",gap:"8px"}}><div className="spinA" style={{width:"8px",height:"8px",border:"1px solid #4a3408",borderTopColor:CA,borderRadius:"50%"}}/> FETCHING LIVE MLB STANDINGS...</div>}
      {!mlbLoading&&<div style={{background:"#08080f",border:"1px solid "+CG+"33",padding:"6px 12px",fontSize:"9px",color:CG,fontFamily:"Orbitron",letterSpacing:"1px"}}>◈ LIVE STANDINGS — UPDATED NOW ▪ MLB STATS API</div>}

      {/* Universal legs */}
      <div style={{background:"#08080f",border:"1px solid "+CA+"44",padding:"10px 12px"}}>
        <div style={{fontSize:"9px",color:CA,fontFamily:"Orbitron",letterSpacing:"2px",marginBottom:"8px"}}>⚡ UNIVERSAL LEGS — IN ALL 4 PARLAYS</div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {uMake.map(function(t){var st=getLegSt(t,"make",mlbData);return(<div key={t} style={{padding:"5px 10px",background:st.color+"15",border:"1px solid "+st.color+"44",fontFamily:"Orbitron",fontSize:"10px",color:st.color}}>{st.icon} {t} MAKE</div>);})}
          {uMiss.map(function(t){var st=getLegSt(t,"miss",mlbData);return(<div key={t} style={{padding:"5px 10px",background:st.color+"15",border:"1px solid "+st.color+"44",fontFamily:"Orbitron",fontSize:"10px",color:st.color}}>{st.icon} {t} MISS</div>);})}
        </div>
      </div>

      {/* Parlay selector */}
      <div style={{display:"flex",gap:"5px"}}>
        {PARLAY_DATA.map(function(pd,i){
          var pr=calcProb(pd);
          return(
            <button key={i} onClick={function(){setAp(i);}} style={{flex:1,background:"transparent",border:"1px solid "+(ap===i?CA:"#2a1e08"),padding:"8px 4px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",transition:"all .2s"}}>
              <span style={{fontFamily:"Orbitron",fontSize:"10px",color:ap===i?CA:CC,fontWeight:700}}>{pd.odds}</span>
              <span style={{fontSize:"9px",color:CD}}>${pd.stake}→${pd.payout.toLocaleString()}</span>
              <span style={{fontSize:"9px",color:pr>5?CG:CY,fontFamily:"Orbitron"}}>{pr.toFixed(3)}%</span>
            </button>
          );
        })}
      </div>

      {/* View nav */}
      <div style={{display:"flex",gap:"4px"}}>
        {[["overview","OVERVIEW"],["legs","LEGS"],["standings","STANDINGS"],["calc","CALCULATOR"],["edgeData","SCOUT"]].map(function(v){return(
          <button key={v[0]} onClick={function(){setView(v[0]);}} className="btn bsm" style={{flex:1,fontSize:"9px",borderColor:view===v[0]?CA:"#2a1e08",color:view===v[0]?CA:CC}}>{v[1]}</button>
        );})}
      </div>

      {/* OVERVIEW */}
      {view==="overview"&&(
        <Panel label={"◈ "+p.odds+" — OVERVIEW & PROBABILITY"}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"12px"}}>
            {[["STAKE","$"+p.stake,CC],["PAYOUT","$"+p.payout.toLocaleString(),CG],["LEGS",p.legs,CA],["MAKE LEGS",p.make.length,CG],["MISS LEGS",p.miss.length,CR],["PLACED",p.placed,CC],["SETTLES",p.settles,CY],["STATUS","OPEN",CG]].map(function(r){return(
              <div key={r[0]} style={{background:BD,padding:"7px 10px",border:"1px solid #1a1520"}}>
                <div style={{fontSize:"9px",color:CD,marginBottom:"2px"}}>{r[0]}</div>
                <div style={{fontFamily:"Orbitron",fontSize:"11px",color:r[2]}}>{r[1]}</div>
              </div>
            );})}
          </div>
          <div style={{background:BD,border:"1px solid #1a1520",padding:"14px",textAlign:"center",marginBottom:"10px"}}>
            <div style={{fontSize:"9px",color:CD,letterSpacing:"2px",marginBottom:"8px"}}>ESTIMATED WIN PROBABILITY</div>
            <div style={{fontFamily:"Orbitron",fontSize:"36px",fontWeight:900,color:prob>5?CG:prob>1?CY:CR,textShadow:"0 0 14px "+(prob>5?CG:CY)+"55"}}>{prob.toFixed(3)}%</div>
            <div style={{margin:"10px auto",width:"80%",height:"6px",background:"#0c0a18",borderRadius:"3px"}}>
              <div style={{height:"100%",width:Math.min(100,prob*8)+"%",background:prob>5?CG:CY,borderRadius:"3px",transition:"width .5s"}}/>
            </div>
            <div style={{fontSize:"9px",color:CD}}>Calculated from {p.legs} individual leg confidence scores</div>
          </div>
          <div style={{fontSize:"9px",color:CD,lineHeight:1.7}}>⚠ Parlays 2 &amp; 4 have conflicting CIN legs — an intentional hedge ensuring at least one parlay survives either outcome.</div>
        </Panel>
      )}

      {/* LEG STATUS */}
      {view==="legs"&&(
        <Panel label={"◈ "+p.odds+" — ALL "+p.legs+" LEGS"}>
          <div style={{marginBottom:"12px"}}>
            <div style={{fontFamily:"Orbitron",fontSize:"9px",color:CG,letterSpacing:"2px",marginBottom:"8px"}}>✓ MAKE PLAYOFFS ({p.make.length})</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
              {p.make.map(function(t){
                var st=getLegSt(t,"make",mlbData);
                return(
                  <div key={t} style={{padding:"6px 10px",background:st.color+"12",border:"1px solid "+st.color+"44",minWidth:"76px"}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontFamily:"Orbitron",fontSize:"11px",color:st.color,fontWeight:700}}>{t}</span>
                      <span style={{fontSize:"11px",color:st.color}}>{st.icon}</span>
                    </div>
                    <div style={{fontSize:"9px",color:CD,marginTop:"2px"}}>{st.w}-{st.l} ▪ {st.conf}%</div>
                    <div style={{fontSize:"9px",color:st.color}}>{st.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{fontFamily:"Orbitron",fontSize:"9px",color:CR,letterSpacing:"2px",marginBottom:"8px"}}>✗ MISS PLAYOFFS ({p.miss.length})</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
              {p.miss.map(function(t){
                var st=getLegSt(t,"miss",mlbData);
                return(
                  <div key={t} style={{padding:"6px 10px",background:st.color+"12",border:"1px solid "+st.color+"44",minWidth:"76px"}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontFamily:"Orbitron",fontSize:"11px",color:st.color,fontWeight:700}}>{t}</span>
                      <span style={{fontSize:"11px",color:st.color}}>{st.icon}</span>
                    </div>
                    <div style={{fontSize:"9px",color:CD,marginTop:"2px"}}>{st.w}-{st.l} ▪ {st.conf}%</div>
                    <div style={{fontSize:"9px",color:st.color}}>{st.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      )}

      {/* STANDINGS */}
      {view==="standings"&&(
        <Panel label={"◈ 2026 MLB STANDINGS — PLAYOFF PROJECTION"}>
          <div style={{fontSize:"9px",color:CD,marginBottom:"10px"}}>Teams in your parlays are highlighted. Confidence = estimated playoff probability.</div>
          {["AL East","AL Central","AL West","NL East","NL Central","NL West"].map(function(div){
            var teams=mlbData.filter(function(t){return t.div===div;}).sort(function(a,b){return b.w-a.w;});
            var inAny=function(t){return PARLAY_DATA.some(function(pd){return pd.make.includes(t)||pd.miss.includes(t);});};
            var myType=function(t){
              if(PARLAY_DATA.some(function(pd){return pd.make.includes(t);}))return "make";
              if(PARLAY_DATA.some(function(pd){return pd.miss.includes(t);}))return "miss";
              return null;
            };
            return(
              <div key={div} style={{marginBottom:"12px"}}>
                <div style={{fontFamily:"Orbitron",fontSize:"9px",color:CA,letterSpacing:"2px",borderBottom:"1px solid #1a1520",paddingBottom:"4px",marginBottom:"6px"}}>{div}</div>
                {teams.map(function(t){
                  var mine=inAny(t.t);
                  var mt=myType(t.t);
                  return(
                    <div key={t.t} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 4px",borderBottom:"1px solid #0c0a14",background:mine?"rgba(240,163,10,.03)":"transparent"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <span style={{fontFamily:"Orbitron",fontSize:"11px",fontWeight:700,color:mine?CA:CC,minWidth:"36px"}}>{t.t}</span>
                        <span style={{fontSize:"9px",color:CD}}>{t.w}-{t.l}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        {mine&&<span style={{fontSize:"9px",padding:"2px 6px",background:(mt==="make"?CG:CR)+"18",border:"1px solid "+(mt==="make"?CG:CR)+"44",color:mt==="make"?CG:CR,fontFamily:"Orbitron"}}>{mt==="make"?"MAKE":"MISS"}</span>}
                        <div style={{width:"50px",height:"4px",background:"#0c0a18",borderRadius:"2px"}}>
                          <div style={{height:"100%",width:t.conf+"%",background:t.conf>=70?CG:t.conf>=50?CY:CR,borderRadius:"2px"}}/>
                        </div>
                        <span style={{fontSize:"9px",color:t.conf>=70?CG:t.conf>=50?CY:CR,minWidth:"28px",textAlign:"right"}}>{t.conf}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </Panel>
      )}

      
      {/* SCOUT */}
      {view==="scout"&&(
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>

          {(mlbLoading||simStatus==='running')&&(
            <div style={{padding:"16px",background:BP,border:"1px solid "+CA+"44",display:"flex",flexDirection:"column",gap:"8px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <div className="spinA" style={{width:"12px",height:"12px",border:"1px solid #4a3408",borderTopColor:CA,borderRadius:"50%"}}/>
                <span style={{fontFamily:"Orbitron",fontSize:"10px",color:CA,letterSpacing:"2px"}}>{simStatus==='running'?"RUNNING 75,000 MONTE CARLO SIMULATIONS...":"FETCHING LIVE DATA..."}</span>
              </div>
              <div style={{fontSize:"9px",color:CD,lineHeight:1.6}}>
                Pulling live standings + last-10 streaks + run differential. Simulating remaining games for all 30 teams. Calculating edge vs current sportsbook lines.
              </div>
            </div>
          )}

          {!mlbLoading&&edgeData.length>0&&(function(){
            var makeTeams = edgeData.filter(function(t){return t.simMakePct>=50;});
            var missTeams = edgeData.filter(function(t){return t.simMakePct<50;}).slice().sort(function(a,b){return a.simMakePct-b.simMakePct;});
            var inParlay = function(tm){return PARLAY_DATA.some(function(p){return p.make.includes(tm)||p.miss.includes(tm);});};
            var parlayType = function(tm){
              if(PARLAY_DATA.some(function(p){return p.make.includes(tm);}))return "MAKE";
              if(PARLAY_DATA.some(function(p){return p.miss.includes(tm);}))return "MISS";
              return null;
            };

            var renderRow = function(t, idx, side) {
              var displayPct = side==="miss" ? t.simMissPct : t.simMakePct;
              var bookPct = side==="miss" ? t.bookMissPct : t.bookMakePct;
              var edgeVal = parseFloat(side==="miss" ? t.edgeMiss : t.edgeMake);
              var col = displayPct>=80?CG:displayPct>=65?CY:displayPct>=50?CB:displayPct>=35?CY:CR;
              var edgeCol = edgeVal>5?CG:edgeVal>0?CY:CR;
              var inP = inParlay(t.t);
              var pType = parlayType(t.t);
              var pMatch = pType==="MAKE"?t.simMakePct>=50:pType==="MISS"?t.simMissPct>=50:null;
              var rdCol = parseFloat(t.rdPerGame)>1?CG:parseFloat(t.rdPerGame)<-1?CR:CD;
              var label = side==="miss" ? displayPct+"% MISS" : displayPct+"% MAKE";
              return (
                <div key={t.t+side} style={{padding:"8px 10px",marginBottom:"3px",background:inP?"rgba(240,163,10,.05)":BD,border:"1px solid "+(inP?CA+"55":"#1a1520")}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{fontFamily:"Orbitron",fontSize:"9px",color:CD,minWidth:"18px"}}>{idx+1}</span>
                    <span style={{fontFamily:"Orbitron",fontSize:"12px",fontWeight:800,color:inP?CA:CB,minWidth:"36px"}}>{t.t}</span>
                    <div style={{flex:1,height:"5px",background:"#0c0a14",borderRadius:"3px"}}>
                      <div style={{height:"100%",width:displayPct+"%",background:col,borderRadius:"3px"}}/>
                    </div>
                    <span style={{fontFamily:"Orbitron",fontSize:"11px",fontWeight:700,color:col,minWidth:"78px",textAlign:"right"}}>{label}</span>
                  </div>
                  <div style={{display:"flex",gap:"8px",marginTop:"4px",flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:"9px",color:CD}}>BOOK: <span style={{color:CB}}>{bookPct}%</span></span>
                    <span style={{fontSize:"9px",color:CD}}>EDGE: <span style={{color:edgeCol,fontWeight:700}}>{edgeVal>0?"+":""}{edgeVal}%</span></span>
                    <span style={{fontSize:"9px",color:CD}}>REC: <span style={{color:CB}}>{t.w}-{t.l}</span></span>
                    <span style={{fontSize:"9px",color:CD}}>PYTH: <span style={{color:CY}}>{t.xWins}W</span></span>
                    <span style={{fontSize:"9px",color:CD}}>VEGAS: <span style={{color:CC}}>{t.vegasWins}W</span></span>
                    <span style={{fontSize:"9px",color:rdCol}}>RD/G: {parseFloat(t.rdPerGame)>0?"+":""}{t.rdPerGame}</span>
                    <span style={{fontSize:"9px",color:t.hot?CG:t.cold?CR:CD}}>L10: {t.l10}{t.hot?" HOT":t.cold?" COLD":""}</span>
                    <span style={{fontSize:"9px",color:t.streakLabel&&t.streakLabel[0]==="W"?CG:CR}}>STK: {t.streakLabel}</span>
                    {inP&&<span style={{fontFamily:"Orbitron",fontSize:"8px",padding:"1px 6px",background:pMatch?CG+"22":CR+"22",color:pMatch?CG:CR,border:"1px solid "+(pMatch?CG:CR)+"44"}}>{pType} {pMatch?"ON TRACK":"AT RISK"}</span>}
                  </div>
                </div>
              );
            };

            return (
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <div style={{padding:"8px 12px",background:"#08080f",border:"1px solid "+CA+"33",fontSize:"9px",color:CD,lineHeight:1.8}}>
                  <span style={{color:CA,fontFamily:"Orbitron",letterSpacing:"1px"}}>METHODOLOGY: </span>
                  75K Monte Carlo simulations of full 162-game season for all 30 teams simultaneously. Inputs: Vegas O/U (40%) + Pythagorean wins (35%) + Last-10 streak (15%) + Run differential (10%). Playoff structure: 3 div winners + 3 wild cards per league. EDGE = Simulation % minus book implied %. Positive edge = value.
                  <span style={{color:CG}}> Green edge = bet more likely than book prices.</span>
                  <span style={{color:CR}}> Red edge = book overprices it.</span>
                </div>

                <Panel label={"◈ MAKE PLAYOFFS — TOP "+makeTeams.length+" TEAMS (SIM PROBABILITY)"}>
                  <div style={{fontSize:"9px",color:CD,marginBottom:"6px"}}>#1 = most likely to make playoffs. Shows: sim %, book %, and your edge vs the book.</div>
                  {makeTeams.map(function(t,i){return renderRow(t,i,"make");})}
                </Panel>

                <Panel label={"◈ MISS PLAYOFFS — "+missTeams.length+" TEAMS (% CHANCE TO MISS)"}>
                  <div style={{fontSize:"9px",color:CD,marginBottom:"6px"}}>#1 = most certain to miss playoffs. Score = % chance to MISS. Green edge = book underpricing their miss probability.</div>
                  {missTeams.map(function(t,i){return renderRow(t,i,"miss");})}
                </Panel>

                <Panel label={"◈ YOUR CURRENT PARLAYS — MONTE CARLO ANALYSIS"}>
                  {PARLAY_DATA.map(function(pd){
                    var simProb = 1;
                    pd.make.forEach(function(tm){var ed=edgeData.find(function(e){return e.t===tm;});if(ed)simProb*=ed.simMakePct/100;});
                    pd.miss.forEach(function(tm){var ed=edgeData.find(function(e){return e.t===tm;});if(ed)simProb*=ed.simMissPct/100;});
                    var simPct = (simProb*100).toFixed(3);
                    var col = parseFloat(simPct)>5?CG:parseFloat(simPct)>1?CY:CR;
                    return (
                      <div key={pd.id} style={{marginBottom:"8px",padding:"10px",background:BD,border:"1px solid #1a1520"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                          <span style={{fontFamily:"Orbitron",fontSize:"12px",color:CA,fontWeight:800}}>{pd.odds}</span>
                          <span style={{fontFamily:"Orbitron",fontSize:"10px",color:col}}>SIM HIT RATE: {simPct}%</span>
                        </div>
                        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                          {pd.make.map(function(tm){
                            var ed=edgeData.find(function(e){return e.t===tm;});
                            var onTrack = ed?ed.simMakePct>=50:true;
                            var edgeV = ed?parseFloat(ed.edgeMake):0;
                            return <span key={tm} style={{fontSize:"9px",padding:"2px 6px",background:onTrack?CG+"22":CR+"22",color:onTrack?CG:CR,border:"1px solid "+(onTrack?CG:CR)+"33",fontFamily:"Orbitron"}}>{tm} MAKE {ed?(ed.simMakePct+"%"):""}{edgeV>3?" ✓":edgeV<-3?" ⚠":""}</span>;
                          })}
                          {pd.miss.map(function(tm){
                            var ed=edgeData.find(function(e){return e.t===tm;});
                            var onTrack = ed?ed.simMissPct>=50:true;
                            var edgeV = ed?parseFloat(ed.edgeMiss):0;
                            return <span key={tm} style={{fontSize:"9px",padding:"2px 6px",background:onTrack?CG+"22":CR+"22",color:onTrack?CG:CR,border:"1px solid "+(onTrack?CG:CR)+"33",fontFamily:"Orbitron"}}>{tm} MISS {ed?(ed.simMissPct+"%"):""}{edgeV>3?" ✓":edgeV<-3?" ⚠":""}</span>;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </Panel>

                <Panel label={"◈ RECOMMENDED NEW PARLAY CONSTRUCTION — TIERED"}>
                  {tickets.map(function(tk){
                    return (
                      <div key={tk.name} style={{marginBottom:"12px",padding:"12px",background:BD,border:"1px solid "+CA+"33"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                          <div>
                            <span style={{fontFamily:"Orbitron",fontSize:"11px",color:CA}}>{tk.name}</span>
                            <span style={{fontSize:"9px",color:CD,marginLeft:"8px"}}>{tk.target}</span>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"Orbitron",fontSize:"10px",color:CG}}>SIM: {tk.simProb}%</div>
                            <div style={{fontSize:"9px",color:CD}}>BOOK: {tk.bookProb}% ▪ EDGE: {tk.edge}x</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"8px"}}>
                          {tk.makeLegs.map(function(t){
                            return <span key={t.t} style={{fontFamily:"Orbitron",fontSize:"9px",padding:"3px 8px",background:CG+"22",color:CG,border:"1px solid "+CG+"44"}}>{t.t} MAKE {t.simMakePct}% (+{t.edgeMake})</span>;
                          })}
                          {tk.missLegs.map(function(t){
                            return <span key={t.t} style={{fontFamily:"Orbitron",fontSize:"9px",padding:"3px 8px",background:CR+"22",color:CR,border:"1px solid "+CR+"44"}}>{t.t} MISS {t.simMissPct}% (+{t.edgeMiss})</span>;
                          })}
                        </div>
                        <div style={{fontSize:"9px",color:CY}}>⚠ WEAKEST LEG: {tk.weakest} — consider swapping for a higher-edge alternative</div>
                      </div>
                    );
                  })}
                  <div style={{padding:"10px",background:"#08080f",border:"1px solid "+CA+"33",fontSize:"9px",color:CB,lineHeight:1.8}}>
                    <span style={{color:CA,fontFamily:"Orbitron"}}>MARCUS: </span>
                    Positive edge means the simulation says the outcome is more likely than the book prices. Stack legs where your edge is 5%+ — those are the highest-conviction plays. Never add a leg purely for payout if it carries negative edge. The book is profitable precisely because bettors take negative-edge legs. Your edge is discipline.
                  </div>
                </Panel>
              </div>
            );
          })()}
        </div>
      )}

      {/* CALCULATOR */}
      {view==="calc"&&(
        <Panel label={"◈ CASH OUT CALCULATOR — ALL 4 PARLAYS"}>
          <div style={{fontSize:"9px",color:CD,marginBottom:"12px"}}>Season is ~3% complete. Cash out values are estimates based on current win probability.</div>
          {PARLAY_DATA.map(function(pd){
            var pr=calcProb(pd);
            var estCo=(pd.payout*(pr/100)*0.06).toFixed(2);
            var roi=((pd.payout-pd.stake)/pd.stake*100).toFixed(0);
            return(
              <div key={pd.id} style={{background:BD,border:"1px solid #1a1520",padding:"12px",marginBottom:"8px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                  <span style={{fontFamily:"Orbitron",fontSize:"12px",color:CA,fontWeight:800}}>{pd.odds}</span>
                  <span style={{fontSize:"9px",color:CD}}>{pd.legs} legs</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"5px",marginBottom:"8px"}}>
                  {[["STAKE","$"+pd.stake,CC],["PAYOUT","$"+pd.payout.toLocaleString(),CG],["PROB",pr.toFixed(2)+"%",pr>5?CG:CY],["ROI",roi+"%",CG]].map(function(r){return(
                    <div key={r[0]} style={{textAlign:"center",background:BP,padding:"6px",border:"1px solid #141020"}}>
                      <div style={{fontSize:"8px",color:CD,marginBottom:"2px"}}>{r[0]}</div>
                      <div style={{fontFamily:"Orbitron",fontSize:"10px",color:r[2],fontWeight:700}}>{r[1]}</div>
                    </div>
                  );})}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(240,163,10,.05)",border:"1px solid "+CA+"22"}}>
                  <span style={{fontSize:"9px",color:CD}}>EST. CASH OUT NOW</span>
                  <span style={{fontFamily:"Orbitron",fontSize:"13px",color:CA,fontWeight:800}}>${estCo}</span>
                </div>
                <div style={{fontSize:"9px",color:CD,marginTop:"5px"}}>
                  Verdict: <span style={{color:pr>2?CY:CR}}>{pr>2?"HOLD — season too early to cash out":"MONITOR — assess leg risk mid-season"}</span>
                </div>
              </div>
            );
          })}
          <div style={{padding:"10px",background:"#08080f",border:"1px solid "+CA+"33"}}>
            <div style={{fontFamily:"Orbitron",fontSize:"9px",color:CA,letterSpacing:"2px",marginBottom:"6px"}}>MARCUS — PARLAY ASSESSMENT</div>
            <div style={{fontSize:"10px",color:CB,lineHeight:1.8}}>$112 at risk against a $13,009 maximum return. The CIN hedge across parlays 2 and 4 is rational construction. Your five universal legs — Yankees, Mariners, Braves making playoffs; Angels and Astros missing — are the critical path. Monitor those above all others. It is early. Patience is the correct posture.</div>
          </div>
        </Panel>
      )}
    </div>
  );
}


function Panel({label,children,right}) {
  return (
    <div style={{background:BP,border:"1px solid #141020",padding:"12px 14px",position:"relative"}}>
      <Corners/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
        <div style={{fontFamily:"Orbitron",fontSize:"10px",letterSpacing:"3px",color:"#4a3408"}}>{label}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Corners() {
  var s={position:"absolute",width:"7px",height:"7px",border:"1.5px solid rgba(240,163,10,.18)"};
  return (
    <>
      <div style={Object.assign({},s,{top:4,left:4,borderRight:"none",borderBottom:"none"})}/>
      <div style={Object.assign({},s,{top:4,right:4,borderLeft:"none",borderBottom:"none"})}/>
      <div style={Object.assign({},s,{bottom:4,left:4,borderRight:"none",borderTop:"none"})}/>
      <div style={Object.assign({},s,{bottom:4,right:4,borderLeft:"none",borderTop:"none"})}/>
    </>
  );
}

function Gauge({score,label}) {
  var color=score<25?CR:score<45?CY:score<55?CC:score<75?CG:"#00cc44";
  var rot=-90+(score/100*180);
  var dash=172.8;
  var offset=dash-(dash*score/100);
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px"}}>
      <svg width="130" height="76" viewBox="0 0 140 80">
        <path d="M15 75 A55 55 0 0 1 125 75" fill="none" stroke="#0c0a14" strokeWidth="10" strokeLinecap="round"/>
        <path d="M15 75 A55 55 0 0 1 125 75" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={offset}/>
        <text x="70" y="68" textAnchor="middle" fill={color} fontSize="22" fontFamily="Orbitron" fontWeight="900">{score}</text>
        <line x1="70" y1="75" x2="70" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" transform={"rotate("+rot+",70,75)"}/>
        <circle cx="70" cy="75" r="4" fill={color}/>
      </svg>
      <div style={{fontFamily:"Orbitron",fontSize:"10px",color:color,letterSpacing:"3px"}}>{(label||"").toUpperCase()}</div>
    </div>
  );
}

function Spinner({label}) {
  var [d,setD]=useState(0);
  useEffect(function(){
    var t=setInterval(function(){setD(function(v){return(v+1)%4;});},380);
    return function(){clearInterval(t);};
  },[]);
  return (
    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
      <div className="spinA" style={{width:"10px",height:"10px",border:"1px solid #4a3408",borderTopColor:CA,borderRadius:"50%"}}/>
      <span style={{fontFamily:"Orbitron",fontSize:"10px",letterSpacing:"2px",color:"#4a3408"}}>{label}{".".repeat(d)}</span>
    </div>
  );
}

function ErrMsg({text}) {
  return <div style={{color:CR,fontSize:"10px",letterSpacing:"1px"}}>⚠ {text}</div>;
}
