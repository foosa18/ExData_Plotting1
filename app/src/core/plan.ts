// Framework reference content (the FAQ tab of the Equity Trading Platform Framework), held as data so both platforms render it.

export const VISION =
  "Build a personal equity research and execution platform that, every trading day, pulls a user-defined universe of 25–30 tickers, computes a consistent set of valuation, risk, momentum and quality KPIs, ranks names within their industry sub-segment, and produces an order-ready shortlist by 8:00 AM ET. Orders are placed by 9:15 AM ET, at least 50% of each position is sold the same day between 2:00 and 3:00 PM ET, and the remainder is managed through the week. Stock analysis comes first; options strategies and an algorithm builder follow once the equity engine is proven.";

export const PILLARS: [string, string][] = [
  ["Speed to decision", "Shortlist ready at 8:00, orders staged by 9:15"],
  ["Comparable analytics", "Every name scored against its own sub-segment peers"],
  ["Risk discipline", "Pre-set sizing, exits and loss limits, enforced by the system"],
  ["Learn and refine", "Every trade journaled and attributed to the signal that drove it"],
];

export interface Workstream { id: string; name: string; owner: string; items: string[]; q: string }
export const WORKSTREAMS: Workstream[] = [
  { id: "WS1", name: "Data & Infrastructure", owner: "Data engineer", q: "Which fields does free data cover, and where must we pay?",
    items: ["Data source assessment across yfinance, Alpaca, and an IV history vendor", "Ingestion pipeline for prices, fundamentals, options chains and the earnings calendar", "Local store (DuckDB or Postgres) with daily point-in-time snapshots", "Data quality gates: staleness, missing fields, split and dividend adjustments", "Scheduler that completes the full pull before 7:30 AM ET"] },
  { id: "WS2", name: "Universe & Classification", owner: "Research lead (UP)", q: "Which sub-segments matter most for the first 25–30 names?",
    items: ["Master ticker list with add and remove workflow", "Industry → sub-segment taxonomy anchored to value-chain position", "Screening criteria (liquidity, price, market cap, events)", "Peer group and sector ETF benchmark per sub-segment", "Quarterly taxonomy review cadence"] },
  { id: "WS3", name: "Analytics & Signal Engine", owner: "Quant analyst", q: "What does a \"buy today\" signal actually mean in rules?",
    items: ["KPI library with tested calculations", "Composite scoring: within-segment z-scores, weighted by category", "Entry signal rules and a \"do not trade\" filter", "Backtest harness on 1–5 years with realistic costs", "Signal performance tracker"] },
  { id: "WS4", name: "Trading Workflow & Execution", owner: "Execution lead", q: "Human approval for every order, or auto-execute within limits?",
    items: ["Morning run book from 7:00 to 9:15 AM ET", "Broker API integration, paper trading first", "Position sizing and risk limits", "Exit engine: 50% same-day trim at 2–3 PM", "Trade journal and P&L attribution"] },
  { id: "WS5", name: "Dashboard & Experience", owner: "Product designer", q: "What is the one screen you look at 8:00–9:15 AM?",
    items: ["Tiered IA: Brief → Watchlist → Stock detail → Raw data", "Wireframes for the morning brief and position monitor", "Alerting design (fills, stops, trim window, data failures)", "Dashboard MVP on the live pipeline", "Web and iOS/Android apps from one codebase"] },
  { id: "WS6", name: "PMO, Risk & Governance", owner: "Engagement manager (UP)", q: "What results justify moving from paper to real capital?",
    items: ["Workplan tracker, weekly status and decision log", "Regulatory and tax checklist", "Phase gates with go / no-go criteria", "Backlog, releases, incident log", "Weekly P&L and monthly strategy review"] },
];

export interface Phase { n: number; name: string; weeks: string; start: number; end: number; items: string[]; gate: string; gateLabel: string }
export const PHASES: Phase[] = [
  { n: 1, name: "Foundation", weeks: "Weeks 1–4", start: 1, end: 4, gateLabel: "Gate to Phase 2",
    items: ["Validate data sources and connect", "Build the list of KPIs and financials", "Agree the first 25–30 tickers and draft taxonomy", "Stand up repo, store, scheduler and tracking", "Outline the dashboard tiers"],
    gate: "Pipeline runs unattended for 5 consecutive mornings, finishes before 7:30 AM ET, and passes data quality checks on every ticker." },
  { n: 2, name: "Core analytics", weeks: "Weeks 5–8", start: 5, end: 8, gateLabel: "Gate to Phase 3",
    items: ["Implement and unit-test the full KPI library", "Define the criteria to refine the stock list", "Build within-segment scoring and entry rules", "Backtest 1–5 years including costs and slippage"],
    gate: "Backtest beats an equal-weight universe benchmark after costs, with a maximum drawdown inside the agreed limit." },
  { n: 3, name: "Trading workflow", weeks: "Weeks 9–12", start: 9, end: 12, gateLabel: "Gate to real capital",
    items: ["Broker integration in paper mode", "Morning brief, order staging and risk checks", "Exit engine: 2–3 PM trim and weekly management", "Trade journal and daily P&L attribution"],
    gate: "At least 20 paper trading days run to the timetable, with no missed 9:15 deadlines and results consistent with the backtest." },
  { n: 4, name: "Dashboard MVP", weeks: "Weeks 13–16", start: 13, end: 16, gateLabel: "Gate to Phase 5",
    items: ["Tier 1 morning brief and Tier 2 watchlist", "Tier 3 stock detail with KPI history charts", "Live position monitor and alerts", "Small real-capital pilot under strict limits"],
    gate: "Morning decision made from the dashboard alone for 2 consecutive weeks; pilot within risk limits." },
  { n: 5, name: "Options & advanced", weeks: "Week 17 onward", start: 17, end: 20, gateLabel: "Exit criteria",
    items: ["Options chain analytics: Greeks, skew, term structure", "Strategy builder (covered calls, verticals, protective puts)", "Commodity exposure via futures or ETFs", "Higher-frequency intraday signals, if justified"],
    gate: "Defined per strategy at Phase 4 review." },
];

export interface Step { start: number; end: number; label: string; time: string; title: string; detail: string; who: string; key?: boolean }
// Minutes after midnight ET.
export const ROUTINE: Step[] = [
  { start: 0, end: 420, label: "Overnight", time: "Overnight", title: "Refresh slow-moving data", detail: "Prior close, fundamentals, earnings calendar, IV history.", who: "Automated" },
  { start: 420, end: 450, label: "7:00", time: "7:00", title: "Pre-market snapshot", detail: "Pre-market quotes and gaps, index futures, VIX, overnight news and earnings.", who: "Automated" },
  { start: 450, end: 480, label: "7:30", time: "7:30", title: "Compute KPIs, scores and quality gates", detail: "Within-segment scoring and \"do not trade\" filters. Failures raise an alert.", who: "Automated" },
  { start: 480, end: 480, label: "8:00", time: "8:00", title: "Morning brief ready", detail: "Ranked shortlist with entry thesis, size, stop and target.", who: "Deadline", key: true },
  { start: 480, end: 525, label: "8:00–8:45", time: "8:00–8:45", title: "Review and select", detail: "Accept, adjust or reject each candidate. Note 8:30 macro releases.", who: "You" },
  { start: 525, end: 550, label: "8:45–9:10", time: "8:45–9:10", title: "Build and risk-check orders", detail: "Limit prices from pre-market quotes; exposure checks.", who: "You approve" },
  { start: 555, end: 555, label: "9:15", time: "9:15", title: "Orders placed", detail: "Limit orders staged for the open, exit brackets attached.", who: "Deadline", key: true },
  { start: 570, end: 600, label: "9:30–10:00", time: "9:30–10:00", title: "Open and fills", detail: "Monitor fills and slippage; cancel orders that run past the band.", who: "Market" },
  { start: 600, end: 840, label: "10:00–14:00", time: "10:00–14:00", title: "Position monitoring", detail: "Stop and target alerts, news on held names, sector moves.", who: "Alerts" },
  { start: 840, end: 900, label: "14:00–15:00", time: "14:00–15:00", title: "Same-day trim: sell at least 50%", detail: "Sell rule decides the remaining 50%: hold, tighten the stop, or exit.", who: "You", key: true },
  { start: 900, end: 950, label: "15:00–15:50", time: "15:00–15:50", title: "Final adjustments", detail: "Market-on-close orders before the ~3:50 PM cutoff.", who: "You" },
  { start: 960, end: 1440, label: "16:00+", time: "16:00+", title: "Close, journal and attribute", detail: "Daily P&L, signal attribution, carry-over stops for tomorrow.", who: "Automated" },
];

export interface Decision { id: string; q: string; options: string; rec: string; when: string }
export const DECISIONS: Decision[] = [
  { id: "D1", q: "Market data vendor", options: "yfinance; Alpaca data; Polygon; Tiingo", rec: "yfinance + Alpaca for prices and fundamentals; upgrade only where a gap is proven", when: "Week 1" },
  { id: "D2", q: "Historical IV source", options: "Own chain snapshots; ORATS; Polygon options; IVolatility", rec: "Start snapshotting chains now and trial one vendor for 1–3 yr back-history", when: "Week 1" },
  { id: "D3", q: "Broker and execution API", options: "Alpaca; Interactive Brokers; Schwab API", rec: "Alpaca for paper trading and the MVP; revisit IBKR for options in Phase 5", when: "Week 2" },
  { id: "D4", q: "Account type and day-trade rules", options: "Margin account (PDT rules apply); cash account (settled funds only)", rec: "Confirm with broker; this decides whether the 50% same-day sale is feasible", when: "Week 2" },
  { id: "D5", q: "Capital and risk limits", options: "Max % per position, per sub-segment, gross exposure, loss limits", rec: "Draft: ≤5% per name, ≤20% per sub-segment, −2% daily stop", when: "Week 4" },
  { id: "D6", q: "Level of automation", options: "Recommend only; approve each order; auto-execute within limits", rec: "Approve each order through Phase 4, then reassess", when: "Week 8" },
  { id: "D7", q: "Exit rules for the remaining 50%", options: "Fixed weekday exit; trailing stop; IV-based target; thesis-driven", rec: "ATR-based stop and target, with a forced exit by Friday close", when: "Week 6" },
  { id: "D8", q: "Benchmark and success metrics", options: "SPY; equal-weight universe; sector ETFs", rec: "Equal-weight universe with same holding rules, plus SPY for context", when: "Week 4" },
  { id: "D9", q: "Hosting and scheduling", options: "Local machine; cloud VM; scheduled cloud job", rec: "Small cloud VM or scheduled job, so the 7:00 run never depends on a laptop", when: "Week 3" },
  { id: "D10", q: "Tax and record keeping", options: "Broker reports only; own ledger with wash-sale tracking", rec: "Own trade ledger from day one; frequent short-term trades make wash sales likely", when: "Week 9" },
];

export type Use = "Screen" | "Signal" | "Risk";
export interface Kpi { m: string; what: string; refresh: string; cx: "Low" | "Medium" | "High"; use: Use[] }
export const KPIS: { group: string; items: Kpi[] }[] = [
  { group: "Valuation", items: [
    { m: "P/E (TTM and forward)", what: "Price paid per dollar of earnings", refresh: "Daily / quarterly", cx: "Low", use: ["Screen"] },
    { m: "PEG ratio", what: "P/E adjusted for expected growth", refresh: "Quarterly", cx: "Low", use: ["Screen"] },
    { m: "EV / EBITDA", what: "Capital-structure neutral valuation", refresh: "Quarterly", cx: "Low", use: ["Screen"] },
    { m: "Free cash flow yield", what: "Cash generated relative to market cap", refresh: "Quarterly", cx: "Medium", use: ["Screen"] },
  ] },
  { group: "Risk & volatility", items: [
    { m: "Beta (1y and 3y)", what: "Sensitivity to SPY and the sector ETF", refresh: "Daily", cx: "Low", use: ["Risk"] },
    { m: "Implied volatility (30-day ATM)", what: "Market's expected move", refresh: "Daily", cx: "Medium", use: ["Signal", "Risk"] },
    { m: "IV change (1, 3, 6 mo; 1–3 yr)", what: "Whether fear or expectations are building", refresh: "Daily", cx: "High", use: ["Signal"] },
    { m: "IV rank / IV percentile", what: "Today's IV versus its own 1-year range", refresh: "Daily", cx: "Medium", use: ["Signal"] },
    { m: "Realized vol and IV–RV spread", what: "Actual versus priced movement", refresh: "Daily", cx: "Medium", use: ["Signal", "Risk"] },
    { m: "ATR (14-day)", what: "Typical daily range; basis for stops and sizing", refresh: "Daily", cx: "Low", use: ["Risk"] },
    { m: "Max drawdown (1–5 yr)", what: "Worst peak-to-trough loss", refresh: "Weekly", cx: "Low", use: ["Screen", "Risk"] },
  ] },
  { group: "Momentum & technicals", items: [
    { m: "Price change (1d to 5yr)", what: "Trend across horizons", refresh: "Daily, pre-market", cx: "Low", use: ["Signal"] },
    { m: "Pre-market gap %", what: "Overnight move versus prior close", refresh: "7:00–9:15 AM", cx: "Low", use: ["Signal"] },
    { m: "Relative strength vs sector ETF", what: "Leading or lagging its peers", refresh: "Daily", cx: "Low", use: ["Signal"] },
    { m: "50 / 200-day MA position", what: "Trend regime filter", refresh: "Daily", cx: "Low", use: ["Screen", "Signal"] },
    { m: "RSI (14)", what: "Overbought or oversold short-term", refresh: "Daily", cx: "Low", use: ["Signal"] },
    { m: "Distance from 52-week high / low", what: "Breakout or mean-reversion context", refresh: "Daily", cx: "Low", use: ["Signal"] },
  ] },
  { group: "Quality & balance sheet", items: [
    { m: "Debt / equity", what: "Leverage and refinancing risk", refresh: "Quarterly", cx: "Low", use: ["Screen"] },
    { m: "WACC", what: "Hurdle rate the business must beat", refresh: "Quarterly", cx: "High", use: ["Screen"] },
    { m: "ROIC − WACC spread", what: "Whether the company creates value", refresh: "Quarterly", cx: "High", use: ["Screen"] },
    { m: "Interest coverage", what: "Debt-servicing headroom", refresh: "Quarterly", cx: "Low", use: ["Screen"] },
    { m: "Gross margin trend", what: "Pricing power over 4–8 quarters", refresh: "Quarterly", cx: "Medium", use: ["Screen"] },
  ] },
  { group: "Liquidity, flow & events", items: [
    { m: "Dollar volume and relative volume", what: "Can we get in and out same day", refresh: "Daily, intraday", cx: "Low", use: ["Screen", "Signal"] },
    { m: "Bid-ask spread (% of price)", what: "Hidden cost of every round trip", refresh: "Intraday", cx: "Low", use: ["Risk"] },
    { m: "Short interest and days to cover", what: "Squeeze risk and crowded positioning", refresh: "Bi-weekly", cx: "Medium", use: ["Risk"] },
    { m: "Days to next earnings", what: "Avoid binary events inside the week", refresh: "Daily", cx: "Low", use: ["Screen", "Risk"] },
  ] },
];

export const UNIVERSE: { industry: string; bench: string; subs: [string, string, string][] }[] = [
  { industry: "Semiconductors", bench: "SMH", subs: [["Manufacturers and foundries", "Own fabs, make the chips", "INTC, TSM, GFS"], ["Fabless chip design", "Design chips, outsource fabrication", "NVDA, AMD, AVGO, QCOM"], ["Equipment", "Tools used to build chips", "ASML, AMAT, LRCX, KLAC"], ["Memory", "DRAM and NAND storage", "MU, WDC"], ["EDA and IP licensing", "Design software and licences", "SNPS, CDNS, ARM"]] },
  { industry: "Software", bench: "IGV", subs: [["Cloud and infrastructure", "Platforms other software runs on", "MSFT, ORCL, SNOW"], ["Cybersecurity", "Networks, endpoints, identity", "CRWD, PANW, ZS"], ["Applications", "End-user business software", "CRM, ADBE, NOW"]] },
  { industry: "Energy", bench: "XLE", subs: [["Integrated oil and gas", "Upstream to refining", "XOM, CVX"], ["Exploration and production", "Most oil-price sensitive", "COP, EOG, DVN"], ["Oilfield services", "Drilling and completion", "SLB, HAL, BKR"]] },
  { industry: "Financials", bench: "XLF", subs: [["Money-center banks", "Lending, deposits, trading", "JPM, BAC, C"], ["Payments", "Transaction networks", "V, MA, PYPL"], ["Alternative asset managers", "Private equity and credit", "BX, KKR, APO"]] },
  { industry: "Commodity proxies", bench: "GDX / DBC", subs: [["Precious metals", "Miners and bullion ETFs", "NEM, GLD"], ["Energy commodities", "Oil and gas via ETFs", "USO, UNG"]] },
];
