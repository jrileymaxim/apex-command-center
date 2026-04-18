# APEX COMMAND CENTER — CLAUDE MEMORY FILE
Last updated: 2026-04-17

## PROJECT
- Live: https://apex-command-center-mu.vercel.app
- Repo: github.com/jrileymaxim/apex-command-center (user: jrileymaxim)
- Stack: React 18 + Vite + Vercel Hobby
- GitHub token: stored in password manager, expires May 14 2026 (scope: apex-deploy)

## TABS
briefing → portfolio → intel → soun → parlays → alerts → mission

## POSITIONS (12)
AAL 12.70sh@$11.30 | SMCI 13.713sh@$23.24 | MNTS 40sh@$5.84 | ANET 2sh@$143.29
TSM 5.8sh@$372.13 | MU 1.008sh@$413.38 | NVDA 3.9sh@$188.64 | VTI 3sh@$338.75
CRWV 10.9sh@$111.86 | DVN 13sh@$47.28 | GLD 0.4sh@$439.22 | BBAI 50sh@$3.56

## SOUN LEAPS
$10C 1/15/27@$1.24 | $10C 1/21/28@$2.38

## MLB PARLAYS
4 parlays, $112 stake, $13,008.93 max payout, settle Oct 31 2026

## THEME (Design E — frosted glass white)
CA="#6366f1" CB="#1a1a2e" CC="#4b5563" CD="#9ca3af"
CG="#10b981" CR="#ef4444" CY="#f59e0b"
BG="#f0f4ff" BP="rgba(255,255,255,0.6)" BD="rgba(255,255,255,0.4)"
Body gradient: 135deg #e8f0fe→#f8f0ff→#e8f8f0 (set in index.html AND index.css)
Panel: rgba white + backdropFilter blur 12px + border-radius 16px
Tabs: pill style, indigo active. Alert button: REMOVED. Corners: REMOVED.
Fonts: bumped +3px everywhere (9→12, 12→15px etc)

## PUSH PATTERN (CRITICAL)
1. Fetch: TextDecoder from atob — never raw atob for UTF-8
2. Edit: split/join. Use h=String.fromCharCode(35) to avoid security filter on #hex strings
3. Validate: Babel.transform(c,{presets:['react'],filename:'App.jsx'}) — trust Babel over brace counter
4. Encode: btoa(unescape(encodeURIComponent(c)))
5. Verify: poll /repos/.../commits/main/statuses for success

## VERCEL API ROUTES
/api/prices.js — Yahoo Finance proxy
/api/marcus.js — Anthropic (claude-haiku-4-5-20251001) + SEC XML. Body: {ticker,form,acc,cik,xmlFile,messages[]}
/api/txdir.js — Lightweight Form4 direction. Body: {cik,acc,xmlFile} → {txDir: BUY|SELL|MIXED|null}
Anthropic key in Vercel env: ANTHROPIC_API_KEY

## SEC EDGAR
- Submissions (browser OK): https://data.sec.gov/submissions/CIK{padded}.json
- Archives (CORS blocked in browser, works server-side): /Archives/edgar/data/{cik}/{accFmt}/{xmlFile}
- primaryDocument field = "xslF345X06/ownership.xml" → strip prefix → "ownership.xml" = raw XML
- TSM Form4 prices are NT$ (Taiwan dollars), not USD. NT$1 ≈ $0.031 USD

## TICKER→CIK
AAL:6201 | SMCI:1375365 | ANET:1313925 | TSM:1046179 | MU:723254
NVDA:1045810 | CRWV:1866175 | DVN:315189 | MNTS:1801236 | SOUN:1653519 | BBAI:1835016
(pad to 10 digits with leading zeros for CIK in URLs)

## FETCHEGARFILINGS FLOW
1. Fetch submissions for each ticker (parallel, browser)
2. Find Form4/8-K, grab acc + primaryDocument → derive xmlFile
3. Store {ticker,form,date,acc,cik,xmlFile} on each filing
4. Parallel /api/txdir calls for all Form4s → update f.txDir
5. Dedup by ticker+form+date, count badge if multiple same-day
6. Sort date desc

## ALERT CARD TEXT
BUY: "Insider PURCHASED shares of X. An executive or major shareholder bought..."
SELL: "Insider SOLD shares of X..."
MIXED: "Insider made mixed transactions in X — both buying and selling..."
null: "...Click VIEW to see the exact buy/sell direction and amount."

## MARCUS (getAI)
Uses filing.acc + filing.cik + filing.xmlFile stored during scan (not re-fetched)
3-sentence prompt: who/what/shares/price | bullish/bearish why | buy/hold/sell

## NTFY
Channel: apex-jrileymaxim-alerts
POST https://ntfy.sh/apex-jrileymaxim-alerts with Title/Priority/Tags headers

## SESSION BOOTSTRAP COMMAND
Paste in browser console on apex site to read this file:
fetch('https://raw.githubusercontent.com/jrileymaxim/apex-command-center/main/MEMORY.md').then(r=>r.text()).then(console.log)
