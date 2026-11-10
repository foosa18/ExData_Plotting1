import { useMemo, useState } from "react";
import { GATE, MAX_DTE, MIN_DTE, TARGET_DTE, TOP_N, W, WL, clamp, group, runScreen, type Group, type Part, type Row } from "../core/screener";
import { Meter } from "../ui/charts";
import { Card, Chip, Label, Seg, Sheet, Stat } from "../ui/kit";
import { cls, num } from "../ui/format";
import { useMedia, WIDE } from "../ui/hooks";

export function VerdictTag({ r }: { r: Pick<Row, "vc" | "verdict"> }) {
  return <span className={"vd vd-" + r.vc}>{r.verdict}</span>;
}
export function BiasTag({ bias }: { bias: string }) {
  const c = bias.indexOf("Call") === 0 ? "b-call" : bias.indexOf("Put") === 0 ? "b-put" : "b-neu";
  return <span className={"bias " + c}>{bias.replace(/ \(.*\)/, "")}</span>;
}

type SortKey = "rank" | "iv_rank" | "iv_hv" | "spread_pct" | "exp_move_pct" | "ticker";
const SORTS: { v: SortKey; l: string; dir: number }[] = [
  { v: "rank", l: "Score", dir: 1 }, { v: "iv_rank", l: "IV Rank", dir: 1 }, { v: "iv_hv", l: "IV/HV", dir: 1 },
  { v: "spread_pct", l: "Spread", dir: 1 }, { v: "exp_move_pct", l: "Exp move", dir: -1 }, { v: "ticker", l: "Ticker", dir: 1 },
];
const COLS: { k: keyof Row; l: string; d?: number; r?: boolean }[] = [
  { k: "rank", l: "#", r: true }, { k: "ticker", l: "Ticker" }, { k: "price", l: "Price", d: 2, r: true }, { k: "bias", l: "Bias" },
  { k: "contract", l: "Contract" }, { k: "mid", l: "Mid $", d: 2, r: true }, { k: "delta", l: "Delta", d: 3, r: true },
  { k: "theta", l: "Theta $/d", d: 3, r: true }, { k: "vega", l: "Vega", d: 3, r: true }, { k: "atm_iv", l: "ATM IV %", d: 0, r: true },
  { k: "iv_rank", l: "IV Rank", d: 0, r: true }, { k: "iv_hv", l: "IV/HV", d: 2, r: true }, { k: "spread_pct", l: "Spread %", d: 1, r: true },
  { k: "exp_move_pct", l: "Exp move %", d: 1, r: true }, { k: "be_pct", l: "B/E %", d: 1, r: true }, { k: "score", l: "Score" }, { k: "verdict", l: "Verdict" },
];

export default function Options({ openTicker, go }: { openTicker?: string; go: (p: string) => void }) {
  const wide = useMedia(WIDE);
  const screen = useMemo(() => runScreen(), []);
  const [f, setF] = useState<"all" | Group>("all");
  const [top, setTop] = useState(TOP_N);
  const [sort, setSort] = useState<{ k: keyof Row; dir: number }>({ k: "rank", dir: 1 });
  const [how, setHow] = useState(false);

  const list = useMemo(() => {
    const l = screen.rows.slice(0, top || screen.rows.length).filter((r) => f === "all" || group(r.vc) === f);
    return l.sort((a, b) => { const x = a[sort.k], y = b[sort.k]; return (typeof x === "string" ? x.localeCompare(String(y)) : (x as number) - (y as number)) * sort.dir; });
  }, [screen, f, top, sort]);
  const buy = screen.rows.filter((r) => group(r.vc) === "buy").length;
  const open = openTicker ? screen.rows.find((r) => r.ticker === openTicker) : undefined;
  const sortBy = (k: keyof Row) => setSort((s) => (s.k === k ? { k, dir: -s.dir } : { k, dir: ["rank", "ticker", "bias", "contract", "verdict"].includes(k as string) ? 1 : -1 }));

  return (
    <div className="stack">
      <div className="stats">
        <Stat label="Mode" value="Demo" sub="mock data from the script" />
        <Stat label="Passed gate" value={screen.rows.length} sub={screen.rejected.length + " of " + screen.screened + " rejected"} />
        <Stat label="Buy premium" value={buy} sub={"of " + screen.rows.length + " passed"} tone="pos" />
        <Stat label="Expiry" value={TARGET_DTE + " DTE"} sub={screen.expiry} />
      </div>

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter by verdict">
          <Chip on={f === "all"} onClick={() => setF("all")}>All</Chip>
          <Chip on={f === "buy"} onClick={() => setF("buy")}>Buy premium</Chip>
          <Chip on={f === "mid"} onClick={() => setF("mid")}>Neutral / caution</Chip>
          <Chip on={f === "avoid"} onClick={() => setF("avoid")}>Avoid / sell</Chip>
        </div>
        <div className="toolbar-r">
          {!wide && (
            <label className="sel">Sort
              <select value={sort.k} onChange={(e) => { const s = SORTS.find((x) => x.v === e.target.value)!; setSort({ k: s.v, dir: s.dir }); }}>
                {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </label>
          )}
          <Seg size="sm" label="How many" value={top} onChange={setTop} options={[{ v: TOP_N, l: "Top 10" }, { v: 0, l: "All" }]} />
        </div>
      </div>

      {wide ? (
        <Card pad={false} className="table-card">
          <div className="hscroll">
            <table className="tbl opt-tbl">
              <thead><tr>{COLS.map((c) => (
                <th key={c.k} className={cls(c.r && "r")} aria-sort={sort.k === c.k ? (sort.dir > 0 ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => sortBy(c.k)}>{c.l}</button>
                </th>))}</tr></thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.ticker} tabIndex={0} onClick={() => go("/options/" + r.ticker)} onKeyDown={(e) => { if (e.key === "Enter") go("/options/" + r.ticker); }}>
                    {COLS.map((c) => {
                      const v = r[c.k];
                      if (c.k === "ticker") return <td key={c.k} className="tick">{r.ticker}</td>;
                      if (c.k === "bias") return <td key={c.k}><BiasTag bias={r.bias} /></td>;
                      if (c.k === "verdict") return <td key={c.k}><VerdictTag r={r} /></td>;
                      if (c.k === "contract") return <td key={c.k} className="mono nowrap">{r.contract}</td>;
                      if (c.k === "score") return <td key={c.k}><span className="score"><span className="num">{num(r.score, 1)}</span><Meter value={r.score} /></span></td>;
                      return <td key={c.k} className={cls("r num", c.k === "iv_hv" && r.iv_hv < 1 && "pos", c.k === "spread_pct" && r.spread_pct > GATE.max_spread_pct && "neg")}>{c.d !== undefined ? num(v as number, c.d) : String(v)}</td>;
                    })}
                  </tr>
                ))}
                {!list.length && <tr><td colSpan={COLS.length} className="muted">No contracts match this filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <ul className="opt-cards">
          {list.map((r) => (
            <li key={r.ticker}>
              <button type="button" className="card pad card-btn opt-card" onClick={() => go("/options/" + r.ticker)}>
                <div className="oc-top">
                  <span className="oc-rank mono">#{r.rank}</span>
                  <span className="tick-lg">{r.ticker}</span>
                  <span className="num muted">${num(r.price, 2)}</span>
                  <span className="oc-score"><span className="num">{num(r.score, 1)}</span><Meter value={r.score} /></span>
                </div>
                <div className="oc-mid"><span className="mono">{r.contract}</span><span className="num">${num(r.mid, 2)}</span></div>
                <div className="oc-tags"><BiasTag bias={r.bias} /><VerdictTag r={r} /></div>
                <dl className="oc-metrics">
                  <div><dt>IV Rank</dt><dd className="num">{r.iv_rank}</dd></div>
                  <div><dt>IV/HV</dt><dd className={cls("num", r.iv_hv < 1 && "pos")}>{num(r.iv_hv, 2)}</dd></div>
                  <div><dt>Spread</dt><dd className={cls("num", r.spread_pct > GATE.max_spread_pct && "neg")}>{num(r.spread_pct, 1)}%</dd></div>
                  <div><dt>Move / B/E</dt><dd className="num">{num(r.exp_move_pct, 1)} / {num(r.be_pct, 1)}</dd></div>
                </dl>
              </button>
            </li>
          ))}
          {!list.length && <li className="muted">No contracts match this filter.</li>}
        </ul>
      )}

      {screen.rejected.length > 0 && (
        <div className="callout"><b>Rejected at the liquidity gate</b>{screen.rejected.map((r) => <span key={r.ticker}><span className="mono">{r.ticker}</span>: {r.why}</span>)}</div>
      )}

      <Card>
        <button type="button" className="disclosure" aria-expanded={how} onClick={() => setHow(!how)}>
          <span className="lbl">How the screener works</span><span className="muted">{how ? "Hide" : "Show"}</span>
        </button>
        {how && <HowItWorks />}
      </Card>

      <Sheet open={!!open} onClose={() => go("/options")} title={open ? <><span className="tick-lg">{open.ticker}</span> <span className="muted num">${num(open.price, 2)}</span></> : ""}>
        {open && <Detail r={open} />}
      </Sheet>
    </div>
  );
}

function Detail({ r }: { r: Row }) {
  const cells: [string, string][] = [
    ["Contract", r.contract], ["Mid", "$" + num(r.mid, 2)], ["DTE", String(r.dte)], ["Delta", num(r.delta, 3)],
    ["Gamma", num(r.gamma, 4)], ["Theta $/d", num(r.theta, 3)], ["Vega", num(r.vega, 3)], ["Beta", num(r.beta, 1)],
    ["ATM IV", num(r.atm_iv, 0) + "%"], ["IV Rank", String(r.iv_rank)], ["IV/HV", num(r.iv_hv, 2)], ["Opt vol", r.opt_vol.toLocaleString("en-US")],
    ["OI", r.oi.toLocaleString("en-US")], ["Spread", num(r.spread_pct, 1) + "%"], ["Exp move", num(r.exp_move_pct, 1) + "%"], ["B/E", num(r.be_pct, 1) + "%"],
  ];
  return (
    <div className="stack">
      <div className="oc-tags"><BiasTag bias={r.bias} /><VerdictTag r={r} /><span className="muted small">Rank #{r.rank} · score <span className="num">{num(r.score, 1)}</span></span></div>
      <dl className="detail-grid">{cells.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className="num">{v}</dd></div>)}</dl>
      <div>
        <Label>Score components (0–100)</Label>
        {(Object.keys(W) as Part[]).map((k) => (
          <div className="part" key={k}><span>{WL[k]} <em className="mono">×{W[k].toFixed(2)}</em></span><span className="bar"><i style={{ width: clamp(r.parts[k]) + "%" }} /></span><span className="num">{num(r.parts[k], 0)}</span></div>
        ))}
      </div>
      <div>
        <Label>Reasoning</Label>
        <p className="body">{r.reasoning}</p>
        {r.demoted && <p className="muted small">Score halved by the {r.verdict} verdict.</p>}
      </div>
      <p className="muted small">Theta and vega are per share (×100 per contract). Beta is shown for sizing, not as a buy signal.</p>
    </div>
  );
}

function HowItWorks() {
  const steps: [string, string, string][] = [
    ["0", "Ingest", "Spot, option chain, IV, volume, OI, bid/ask (yfinance in live mode)"],
    ["1", "Liquidity gate", "Reject on stock volume, OI and contract volume; spread checked in the verdict"],
    ["2", "Expiry", "Nearest " + TARGET_DTE + " DTE within " + MIN_DTE + "–" + MAX_DTE],
    ["3", "Vol regime", "IV Rank plus IV/HV: is premium cheap to buy or rich?"],
    ["4", "Greeks", "Black-Scholes delta, gamma, theta, vega from each contract's IV"],
    ["5–6", "Score and rank", "Weighted composite, top N across the universe with verdict and reasoning"],
  ];
  const legend: [string, string, string, string][] = [
    ["buyc", "BUY PREMIUM (cheap)", "IV Rank 20–50 and IV/HV < 1.0", "Options underpriced"],
    ["buy", "BUY PREMIUM", "IV Rank 20–50", "Moderate, room to expand"],
    ["neu", "NEUTRAL", "IV Rank 50–75", "Fair, need a directional view"],
    ["cau", "CAUTION (rich)", "IV Rank > 75", "Expensive"],
    ["sell", "SELL PREMIUM", "IV Rank > 75 and IV/HV > 1.3", "Overpriced (not a buy)"],
    ["avoid", "AVOID LOW VOL", "IV Rank < 20", "Too cheap to bother"],
    ["earn", "AVOID EARNINGS", "Earnings inside the window", "IV-crush risk"],
    ["avoid", "AVOID ILLIQUID", "Spread > 12%", "Spread too wide to fill well"],
  ];
  return (
    <div className="stack how">
      <p className="body">The screener picks the best vehicle and says whether premium is cheap or rich. It does not supply a directional thesis: you decide call versus put and whether to trade.</p>
      <ol className="pipe">{steps.map(([n, t, d]) => <li key={n}><span className="mono accent">{n}</span><b>{t}</b><span className="muted">{d}</span></li>)}</ol>
      <div>
        <Label>Composite score weights</Label>
        <div className="weights">{(Object.keys(W) as Part[]).map((k) => <div key={k} style={{ flex: W[k] }}><i /><span>{WL[k]}</span><b className="num">{Math.round(W[k] * 100)}%</b></div>)}</div>
      </div>
      <div>
        <Label>Verdict legend</Label>
        <ul className="legend-list">{legend.map(([c, v, rule, m]) => <li key={v}><span className={"vd vd-" + c}>{v}</span><span className="mono small">{rule}</span><span className="muted small">{m}</span></li>)}</ul>
        <p className="muted small">AVOID and SELL PREMIUM rows have their score halved, so they sink in the ranking but stay visible.</p>
      </div>
      <ul className="rules">
        <li><b>Liquidity gate</b> Avg stock volume ≥ 1.5M shares, OI ≥ 500, contract volume ≥ 50; spread above 12% flags AVOID ILLIQUID.</li>
        <li><b>Holding window</b> 30–90 DTE, target 45. Risk-free rate 4.3%.</li>
        <li><b>Bias</b> Call if 1-month return &gt; 1.5% and price in the upper 55% of its 52-week range; put if &lt; −3% and in the lower 45%.</li>
        <li><b>Limitations</b> Direction not provided. IV Rank in live mode is a proxy from realised vol. Not investment advice.</li>
      </ul>
      <div className="callout"><b>Data: demo universe</b><span>The 16 tickers come from the script's <span className="mono">demo_universe()</span>, scored with the same formulas. For live chains run <span className="mono">python options_screener_v2.py --live</span> locally.</span></div>
    </div>
  );
}
