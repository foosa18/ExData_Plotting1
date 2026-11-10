// Options Screener v2, ported unchanged from the platform's Options Screener tab (itself a port of options_screener_v2.py).
// Runs on the script's demo_universe(); live chains come later from the Python engine.

export const MIN_DTE = 30, TARGET_DTE = 45, MAX_DTE = 90, RISK_FREE = 0.043, TOP_N = 10;
export const GATE = { min_stock_vol_M: 1.5, min_oi: 500, min_opt_vol: 50, max_spread_pct: 12.0 };
export const W = { liquidity: 0.25, vol_regime: 0.3, theta_eff: 0.15, gamma_theta: 0.15, vega_align: 0.1, move_edge: 0.05 };
export type Part = keyof typeof W;
export const WL: Record<Part, string> = {
  liquidity: "Liquidity", vol_regime: "Vol regime", theta_eff: "Theta efficiency",
  gamma_theta: "Gamma / theta", vega_align: "Vega alignment", move_edge: "Move edge",
};

function erf(x: number) {
  const t = 1 / (1 + 0.5 * Math.abs(x));
  const y = 1 - t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? y : -y;
}
const npdf = (x: number) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
const ncdf = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));

function bs(S: number, K: number, T: number, iv: number, r: number, call: boolean) {
  if (T <= 0 || iv <= 0) return { price: Math.max(0, call ? S - K : K - S), delta: 0, gamma: 0, theta: 0, vega: 0 };
  const d1 = (Math.log(S / K) + (r + 0.5 * iv * iv) * T) / (iv * Math.sqrt(T)), d2 = d1 - iv * Math.sqrt(T), disc = Math.exp(-r * T);
  let price, delta, theta;
  if (call) { price = S * ncdf(d1) - K * disc * ncdf(d2); delta = ncdf(d1); theta = -(S * npdf(d1) * iv) / (2 * Math.sqrt(T)) - r * K * disc * ncdf(d2); }
  else { price = K * disc * ncdf(-d2) - S * ncdf(-d1); delta = ncdf(d1) - 1; theta = -(S * npdf(d1) * iv) / (2 * Math.sqrt(T)) + r * K * disc * ncdf(-d2); }
  return { price, delta, gamma: npdf(d1) / (S * iv * Math.sqrt(T)), theta: theta / 365, vega: (S * npdf(d1) * Math.sqrt(T)) / 100 };
}
export const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
const rnd = (x: number, n: number) => { const m = Math.pow(10, n); return Math.round(x * m) / m; };
const volRegime = (ivr: number, ivhv: number) => clamp(0.5 * clamp(100 - Math.abs(ivr - 35) * 1.6) + 0.5 * clamp((1.1 - ivhv) * 120));
const liqScore = (sp: number, oi: number, ov: number) => clamp(0.5 * clamp(100 - sp * 7) + 0.3 * clamp((Math.log10(Math.max(oi, 1)) / 4) * 100) + 0.2 * clamp((Math.log10(Math.max(ov, 1)) / 3) * 100));
const thetaEff = (th: number, mid: number) => (mid <= 0 ? 0 : clamp(100 - (Math.abs(th) / mid) * 100 * 30));
const gammaTheta = (g: number, th: number, S: number) => { if (th === 0) return 50; const ratio = (g * S * S * 0.0001) / Math.max(Math.abs(th), 1e-9); return clamp(Math.log10(Math.max(ratio, 1e-3) + 1) * 60); };
const vegaAlign = (v: number, mid: number, ivr: number) => (mid <= 0 ? 50 : clamp(50 + ((45 - ivr) / 45) * (v / mid) * 400));
const moveEdge = (em: number, be: number) => (be <= 0 ? 50 : clamp((em / be) * 45));

export type VerdictCode = "buyc" | "buy" | "neu" | "cau" | "sell" | "avoid" | "earn";
function verdict(ivr: number, ivhv: number, sp: number, earn: boolean): [string, VerdictCode] {
  if (earn) return ["AVOID EARNINGS", "earn"];
  if (sp > GATE.max_spread_pct) return ["AVOID ILLIQUID", "avoid"];
  if (ivr < 20) return ["AVOID LOW VOL", "avoid"];
  if (ivr > 75 && ivhv > 1.3) return ["SELL PREMIUM", "sell"];
  if (ivr > 75) return ["CAUTION (rich)", "cau"];
  if (ivr >= 50) return ["NEUTRAL", "neu"];
  if (ivhv < 1.0) return ["BUY PREMIUM (cheap)", "buyc"];
  return ["BUY PREMIUM", "buy"];
}
function bias(r1: number, p: number, hi: number, lo: number) {
  const pos = hi > lo ? (p - lo) / (hi - lo) : 0.5;
  if (r1 > 1.5 && pos > 0.55) return "Call (up-momo)";
  if (r1 < -3 && pos < 0.45) return "Put (down-momo)";
  return "Neutral (no edge)";
}
function atm(S: number) { const st = S < 25 ? 0.5 : S < 100 ? 1 : S < 250 ? 2.5 : S < 500 ? 5 : 10; return Math.round(S / st) * st; }
function reason(ivr: number, ivhv: number, th: number, mid: number, sp: number, em: number, be: number, side: string) {
  const burn = mid ? (Math.abs(th) / mid) * 100 : 0, b = ["IV Rank " + ivr.toFixed(0), "IV/HV " + ivhv.toFixed(2)];
  b.push(ivhv < 1 ? "premium cheap vs realized" : "premium fair/rich");
  b.push("theta ~" + burn.toFixed(2) + "%/day");
  b.push(em >= be ? "exp move " + em.toFixed(1) + "% > B/E " + be.toFixed(1) + "%" : "exp move " + em.toFixed(1) + "% < B/E " + be.toFixed(1) + "% (needs trend)");
  b.push("spread " + sp.toFixed(1) + "%");
  return side + ": " + b.join(", ");
}
const iso = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// demo_universe() from options_screener_v2.py: ticker, price, 52w hi, 52w lo, 1m ret %, avg vol M, ATM IV, HV20, HV60, IV/HV, IV rank, days to earnings
type Raw = [string, number, number, number, number, number, number, number, number, number, number, number | null];
const RAW: Raw[] = [["MSTR", 285, 545, 170, -8.2, 28.5, 92, 105, 95, 0.88, 72, null], ["IBIT", 44.81, 71.82, 35.3, -3.2, 44, 58, 62, 55, 0.94, 68, null], ["COIN", 248.5, 410, 145, -4.1, 18.2, 71, 78, 72, 0.91, 62, 78], ["AMD", 132.4, 215, 95, -0.5, 45.2, 51, 45, 52, 1.13, 48, 80], ["SPY", 717.64, 745, 580, -1.5, 85.2, 18, 14, 16, 1.29, 45, null], ["ARKK", 58.2, 82.5, 42, -4.8, 18.5, 42, 39, 44, 1.08, 45, null], ["QQQ", 582.4, 615, 455, -1.2, 35.8, 20, 17, 19, 1.18, 42, null], ["NET", 168.5, 245, 88, -3.5, 4.2, 49, 45, 51, 1.09, 38, 70], ["XLE", 92.4, 105, 75, 1.8, 18.2, 28, 24, 27, 1.17, 35, null], ["MSFT", 502.3, 555, 385, -0.8, 22.1, 24, 20, 22, 1.2, 32, 74], ["META", 720.5, 805, 475, 2.1, 18.4, 32, 28, 34, 1.14, 28, 75], ["GLD", 435.1, 470, 315, -2.6, 12.1, 16, 14, 17, 1.14, 28, null], ["PLTR", 118.2, 195, 55, -2.8, 62.4, 65, 58, 68, 1.12, 60, null], ["VST", 88.45, 198, 78, -4.5, 12.3, 52, 48, 55, 1.08, 58, 95], ["TSLA", 348.9, 488.5, 215, -2.4, 92.1, 62, 58, 66, 1.07, 55, 73], ["EL", 82.13, 121.64, 62.03, -1.8, 5.8, 41, 38, 42, 1.08, 52, 95]];
const BETA: Record<string, number> = { MSTR: 2.6, IBIT: 2.1, COIN: 2.4, AMD: 1.7, SPY: 1.0, ARKK: 1.6, QQQ: 1.1, NET: 1.5, XLE: 0.7, MSFT: 1.0, META: 1.2, GLD: 0.1, PLTR: 1.8, VST: 1.1, TSLA: 1.9, EL: 0.8 };

export interface Row {
  rank: number; ticker: string; price: number; bias: string; contract: string; dte: number; strike: number; mid: number;
  delta: number; gamma: number; theta: number; vega: number; beta: number; atm_iv: number; iv_rank: number; iv_hv: number;
  opt_vol: number; oi: number; spread_pct: number; exp_move_pct: number; be_pct: number; score: number;
  verdict: string; vc: VerdictCode; demoted: boolean; parts: Record<Part, number>; reasoning: string;
}
export interface Rejected { ticker: string; why: string }

export function runScreen(today = new Date()) {
  const exp = new Date(today); exp.setDate(exp.getDate() + TARGET_DTE);
  const EXPIRY = iso(exp);
  const uni = RAW.map((a) => {
    const vM = a[5];
    return {
      ticker: a[0], price: a[1], stock_vol_M: vM, atm_iv: a[6], iv_hv: a[9], iv_rank: a[10], beta: BETA[a[0]],
      opt_vol: Math.trunc(Math.max(30, vM * 120)), oi: Math.trunc(Math.max(200, vM * 450)),
      spread_pct: rnd(Math.max(1, 16 / (vM + 1) + (vM < 8 ? 2 : 0.5)), 1), dte: TARGET_DTE,
      earnings_in_window: a[11] != null && a[11] <= TARGET_DTE, bias: bias(a[4], a[1], a[2], a[3]),
    };
  });
  const rows: Row[] = [], rejected: Rejected[] = [];
  for (const t of uni) {
    if (t.stock_vol_M < GATE.min_stock_vol_M) { rejected.push({ ticker: t.ticker, why: "avg stock volume " + t.stock_vol_M + "M < " + GATE.min_stock_vol_M + "M" }); continue; }
    if (t.oi < GATE.min_oi || t.opt_vol < GATE.min_opt_vol) { rejected.push({ ticker: t.ticker, why: "OI " + t.oi + " / contract volume " + t.opt_vol + " below gate" }); continue; }
    const S = t.price, ivr = t.iv_rank, iv = t.atm_iv / 100, T = t.dte / 365, side = t.bias, call = side.indexOf("Put") !== 0;
    const K = atm(S), g = bs(S, K, T, iv, RISK_FREE, call), mid = g.price, sp = t.spread_pct;
    const be = call ? K + mid : K - mid, bePct = (Math.abs(be - S) / S) * 100, em = (t.atm_iv / 100) * Math.sqrt(T) * 100;
    const parts: Record<Part, number> = {
      liquidity: liqScore(sp, t.oi, t.opt_vol), vol_regime: volRegime(ivr, t.iv_hv), theta_eff: thetaEff(g.theta, mid),
      gamma_theta: gammaTheta(g.gamma, g.theta, S), vega_align: vegaAlign(g.vega, mid, ivr), move_edge: moveEdge(em, bePct),
    };
    let score = rnd((Object.keys(W) as Part[]).reduce((s, k) => s + W[k] * parts[k], 0), 1);
    const v = verdict(ivr, t.iv_hv, sp, t.earnings_in_window);
    let demoted = false;
    if (v[0].indexOf("AVOID") === 0 || v[0] === "SELL PREMIUM") { score *= 0.5; demoted = true; }
    rows.push({
      rank: 0, ticker: t.ticker, price: S, bias: side, contract: (call ? "C " : "P ") + K + " @ " + EXPIRY, dte: t.dte, strike: K,
      mid: rnd(mid, 2), delta: rnd(g.delta, 3), gamma: rnd(g.gamma, 4), theta: rnd(g.theta, 3), vega: rnd(g.vega, 3), beta: t.beta,
      atm_iv: t.atm_iv, iv_rank: ivr, iv_hv: t.iv_hv, opt_vol: t.opt_vol, oi: t.oi, spread_pct: rnd(sp, 1), exp_move_pct: rnd(em, 1),
      be_pct: rnd(bePct, 1), score: rnd(score, 1), verdict: v[0], vc: v[1], demoted, parts, reasoning: reason(ivr, t.iv_hv, g.theta, mid, sp, em, bePct, side),
    });
  }
  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => { r.rank = i + 1; });
  return { rows, rejected, screened: uni.length, expiry: EXPIRY };
}

export type Group = "buy" | "mid" | "avoid";
export const group = (vc: VerdictCode): Group => (vc === "buy" || vc === "buyc" ? "buy" : vc === "neu" || vc === "cau" ? "mid" : "avoid");
