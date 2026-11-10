// Portfolio Allocation Desk maths, ported unchanged from desk/index.html so both platforms share one implementation.
import { FUNDS, type Fund } from "./funds.ts";
import type { Account, Holding, Target } from "../data/types.ts";

export const F: Record<string, Fund> = Object.fromEntries(FUNDS.map((f) => [f.t, f]));
export const TICKERS = FUNDS.map((f) => f.t).sort();
export const ACCOUNT_COLORS = ["#0f6e63", "#c2762a", "#3f6ea8", "#8a4f7d", "#5c7a3a", "#9e5a4a"];

/** category -> [expected return, stress drawdown, kind (0 equity, 1 bond, 2 gold, 3 allocation 80/20)] */
const CAT: Record<string, [number, number, number]> = {
  "US Large Blend": [0.07, -0.5, 0], "US Total Market": [0.07, -0.5, 0], "US Large Growth": [0.072, -0.55, 0],
  "US Large Growth (Active)": [0.07, -0.55, 0], "US Momentum Factor": [0.074, -0.58, 0],
  "US Small Cap Value": [0.08, -0.55, 0], "US Small Cap Growth": [0.074, -0.58, 0], "US Small Cap Blend": [0.076, -0.56, 0],
  "US Free Cash Flow Value": [0.075, -0.48, 0], "US Dividend Value": [0.065, -0.45, 0], "US Dividend Growth": [0.067, -0.45, 0],
  "US Large Value": [0.066, -0.45, 0], "International Total": [0.073, -0.52, 0], "International Small Blend": [0.075, -0.58, 0],
  "International Small Value": [0.08, -0.58, 0], "Emerging Markets": [0.078, -0.62, 0],
  "US Aggregate Bond": [0.045, -0.05, 1], "US Treasury": [0.04, 0.02, 1],
  "Commodity — Gold": [0.04, 0.05, 2], "US REIT": [0.065, -0.68, 0],
  "Semiconductors": [0.09, -0.65, 0], "Memory Semiconductors": [0.095, -0.75, 0],
  "Technology Sector": [0.078, -0.6, 0], "Healthcare Sector": [0.066, -0.38, 0], "Financials Sector": [0.07, -0.55, 0],
  "Industrials Sector": [0.07, -0.52, 0], "Energy Sector": [0.062, -0.52, 0], "Natural Resources": [0.06, -0.5, 0],
  "Utilities Sector (Active)": [0.062, -0.4, 0], "Allocation 80/20": [0.066, -0.4, 3], "Allocation 60/40 (Active)": [0.058, -0.32, 3],
};
const meta = (t: string) => CAT[F[t].c] || [0.07, -0.5, 0];

const BUCKET: Record<string, string> = {
  "US Large Blend": "uscore", "US Total Market": "uscore", "US Large Growth": "usgrowth",
  "US Large Growth (Active)": "usgrowth", "US Momentum Factor": "usmom", "US Small Cap Value": "smallval",
  "US Small Cap Growth": "smallgro", "US Small Cap Blend": "smallgro", "US Free Cash Flow Value": "usval",
  "US Dividend Value": "div", "US Dividend Growth": "div", "US Large Value": "usval",
  "International Total": "intl", "International Small Blend": "intlsm", "International Small Value": "intlsm",
  "Emerging Markets": "em", "US Aggregate Bond": "bond", "US Treasury": "bond", "Commodity — Gold": "gold",
  "US REIT": "reit", "Semiconductors": "semi", "Memory Semiconductors": "semi", "Technology Sector": "tech",
  "Healthcare Sector": "hc", "Financials Sector": "fin", "Industrials Sector": "ind", "Energy Sector": "energy",
  "Natural Resources": "energy", "Utilities Sector (Active)": "util", "Allocation 80/20": "allin", "Allocation 60/40 (Active)": "allin",
};

export type Period = "ytd" | "1m" | "3m" | "6m" | "3y" | "5y";
export const PERIODS: Record<Period, [string, number, string]> = {
  ytd: ["ytd", 0.78, "YTD"], "1m": ["ytd", 0.0833, "1M"], "3m": ["ytd", 0.25, "3M"], "6m": ["ytd", 0.5, "6M"],
  "3y": ["r3", 3, "3Y"], "5y": ["r5", 5, "5Y"],
};

export type Holdings = Record<string, Holding[]>;
export type Targets = Record<string, Target[]>;

export const acctBal = (h: Holdings, k: string) => (h[k] || []).reduce((s, r) => s + (+r[1] || 0), 0);
export const totalBal = (h: Holdings, accounts: Account[]) => accounts.reduce((s, a) => s + acctBal(h, a.k), 0);

export interface HoldingReturn { cum: number; ann: number; yrs: number }

/** Return over the window actually held, or null when the fund did not exist for the selected period. */
export function holdingReturn(ticker: string, months: number, period: Period): HoldingReturn | null {
  const f = F[ticker];
  if (!f) return null;
  const [field, pYears] = PERIODS[period];
  const age = 2026 - f.y;
  if (field === "ytd") {
    if (f.ytd === null || age < 1) return null;
    const windowYrs = Math.min(months / 12, pYears);
    if (windowYrs <= 0) return null;
    const annualised = Math.pow(1 + f.ytd / 100, 1 / 0.78) - 1;
    const cum = Math.pow(1 + annualised, windowYrs) - 1;
    return { cum: cum * 100, ann: annualised * 100, yrs: windowYrs };
  }
  const r = f[field as "r3" | "r5"];
  if (r === null || r === undefined || age < pYears) return null;
  const windowYrs = Math.min(months / 12, pYears);
  if (windowYrs <= 0) return null;
  const ann = r / 100;
  return { cum: (Math.pow(1 + ann, windowYrs) - 1) * 100, ann: ann * 100, yrs: windowYrs };
}

export function xirrSolve(flows: { t: number; amt: number }[]): number {
  let r = 0.12;
  for (let i = 0; i < 200; i++) {
    let f = 0, d = 0;
    for (const c of flows) { const b = Math.pow(1 + r, c.t); f += c.amt / b; d += (-c.t * c.amt) / (b * (1 + r)); }
    if (!isFinite(f) || Math.abs(d) < 1e-10) break;
    const nr = r - f / d;
    if (!isFinite(nr) || nr <= -0.95) { r = Math.max(-0.9, r * 0.5); continue; }
    if (Math.abs(nr - r) < 1e-9) { r = nr; break; }
    r = nr;
  }
  return r;
}

export function portfolioXirr(h: Holdings, accounts: Account[], period: Period) {
  const pYears = PERIODS[period][1];
  const flows: { t: number; amt: number }[] = [];
  let used = 0, skipped = 0;
  accounts.forEach((a) => (h[a.k] || []).forEach(([t, cap, mo]) => {
    const cash = +cap || 0;
    if (cash <= 0) return;
    const r = holdingReturn(t, +mo || 0, period);
    if (!r) { skipped++; return; }
    used++;
    flows.push({ t: Math.max(0, pYears - r.yrs), amt: -cash });
    flows.push({ t: pYears, amt: cash * (1 + r.cum / 100) });
  }));
  return { xirr: used ? xirrSolve(flows) * 100 : null, used, total: used + skipped };
}

export function mirrorFromHoldings(h: Holdings, accounts: Account[]): Targets {
  const s: Targets = {};
  accounts.forEach((a) => {
    const rows = h[a.k] || [], bal = rows.reduce((x, r) => x + r[1], 0);
    const agg: Record<string, number> = {};
    rows.forEach((r) => { agg[r[0]] = (agg[r[0]] || 0) + r[1]; });
    s[a.k] = bal > 0 ? Object.entries(agg).map(([t, c]) => [t, Math.round((c / bal) * 100)] as Target) : [];
  });
  return s;
}

export interface Gap { title: string; detail: string }
export function gaps(h: Holdings, accounts: Account[], notes: [string, string][], bondBand: string): Gap[] {
  let bond = 0, gold = 0, intl = 0, tot = 0;
  accounts.forEach((a) => (h[a.k] || []).forEach(([t, cap]) => {
    const amt = +cap || 0;
    if (!F[t]) return;
    tot += amt;
    const m = meta(t);
    if (m[2] === 1) bond += amt;
    if (m[2] === 3) bond += amt * 0.2;
    if (m[2] === 2) gold += amt;
    if (/International|Emerging/.test(F[t].c)) intl += amt;
    if (F[t].c === "Allocation 80/20") intl += amt * 0.35;
  }));
  const bp = tot ? (bond / tot) * 100 : 0, gp = tot ? (gold / tot) * 100 : 0, ip = tot ? (intl / tot) * 100 : 0;
  const g: Gap[] = [];
  if (bp < 10) g.push({ title: "Bonds at " + bp.toFixed(1) + "%", detail: bondBand });
  if (gp < 2) g.push({ title: "No inflation hedge", detail: "Gold belongs in a tax-deferred account, where the 28% collectibles rate does not apply." });
  if (ip < 20) g.push({ title: "International at " + ip.toFixed(0) + "%", detail: "Institutional capital-market assumptions have favoured ex-US on relative valuation." });
  notes.forEach(([title, detail]) => g.push({ title, detail }));
  return g.slice(0, 5);
}

export interface Projection {
  r: number; feePct: number; dd: number; eq: number; bd: number; n: number;
  fv: number; lo: number; hi: number; H: number; base: number;
  median: number[]; low: number[]; high: number[];
  dup: [string, { amt: number; funds: string[] }][]; dupFunds: number; feeLoss: number;
}

export function project(h: Holdings, sim: Targets, accounts: Account[], H: number, shock: number): Projection | null {
  let ret = 0, fee = 0, dd = 0, eq = 0, bd = 0, base = 0;
  const seen = new Set<string>(), buckets: Record<string, { amt: number; funds: string[] }> = {};
  accounts.forEach((a) => {
    const bal = acctBal(h, a.k);
    (sim[a.k] || []).forEach(([t, w]) => {
      if (!F[t]) return;
      const amt = (bal * w) / 100, m = meta(t), f = F[t];
      base += amt; ret += m[0] * amt; fee += (f.er / 100) * amt; dd += m[1] * amt;
      if (m[2] === 1) bd += amt; else if (m[2] === 3) { bd += amt * 0.2; eq += amt * 0.8; } else if (m[2] === 0) eq += amt;
      seen.add(t);
      const b = BUCKET[f.c] || "other";
      buckets[b] = buckets[b] || { amt: 0, funds: [] };
      buckets[b].amt += amt;
      if (!buckets[b].funds.includes(t)) buckets[b].funds.push(t);
    });
  });
  if (base <= 0) return null;
  const r = (ret / base - fee / base) * shock;
  const contrib = accounts.reduce((s, a) => s + a.mo * 12, 0);
  const grow = (x: number) => { let v = base; for (let i = 0; i < H; i++) v = v * (1 + x) + contrib; return v; };
  const path = (x: number) => { const p: number[] = []; let v = base; for (let i = 0; i <= H; i++) { p.push(v); v = v * (1 + x) + contrib; } return p; };
  const dup = Object.entries(buckets).filter(([, x]) => x.funds.length > 1);
  const dupFunds = dup.reduce((s, [, x]) => s + x.funds.length - 1, 0);
  const feePct = fee / base, bench = 0.0007;
  const feeLoss = Math.abs(grow(r) - grow(r + Math.max(0, feePct - bench)));
  return {
    r, feePct, dd: dd / base, eq: eq / base, bd: bd / base, n: seen.size, fv: grow(r), lo: grow(r - 0.03), hi: grow(r + 0.025),
    H, base, median: path(r), low: path(r - 0.03), high: path(r + 0.025), dup, dupFunds, feeLoss,
  };
}

export type FlagTone = "ok" | "warn" | "bad";
export interface Flag { tone: FlagTone; title: string; body: string }

export function verdicts(c: Projection): Flag[] {
  const v: Flag[] = [];
  const pct = (n: number, d = 1) => (n >= 0 ? "" : "-") + Math.abs(n).toFixed(d) + "%";
  const fmtK = (n: number) => (n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M" : "$" + Math.round(n / 1e3) + "k");
  if (c.dupFunds > 0) {
    const names = c.dup.map(([, x]) => x.funds.join(" / ")).slice(0, 2).join("; ");
    v.push({ tone: "bad", title: "Cut " + c.dupFunds + " redundant fund" + (c.dupFunds > 1 ? "s" : "") + ".",
      body: names + " buy the same exposure, so the extra tickers add tracking work without adding diversification. Consolidating leaves the return unchanged and makes the portfolio legible in one screen." });
  }
  if (c.feePct > 0.0012) {
    v.push({ tone: "bad", title: "Fees cost about " + fmtK(c.feeLoss) + " over " + c.H + " years.",
      body: "Your weighted expense ratio is " + pct(c.feePct * 100, 3) + " against roughly 0.07% for an index-only build. Replacing the costliest active funds with their index equivalents recovers most of that." });
  }
  if (c.bd < 0.1) {
    v.push({ tone: "warn", title: "Bonds sit at " + Math.round(c.bd * 100) + "%, below the 10–15% band.",
      body: "A " + pct(c.dd * 100, 0) + " drawdown would leave almost nothing to rebalance from. Adding a bond index fund in the 401(k) fixes this without touching either IRA." });
  }
  if (c.n > 14) {
    v.push({ tone: "warn", title: c.n + " funds is roughly triple the retail norm.",
      body: "Published model portfolios cluster at three to five funds. Every extra ticker is another decision point in a drawdown, where the behaviour gap does its damage." });
  }
  if (!v.length) v.push({ tone: "ok", title: "Structure checks out.",
    body: "No duplicated exposure, fees near the achievable floor and a defensible bond weight. From here the savings rate matters more than any further allocation change." });
  return v.slice(0, 2);
}
