import { useMemo, useState } from "react";
import { PROFILE } from "../../data/profile";
import { acctBal } from "../../core/desk";
import { Card, KpiRow, Label, Seg } from "../../ui/kit";
import { ProjectionChart } from "../../ui/charts";
import { cls, fmt, fmtK, signed } from "../../ui/format";
import { TrendChart, BudgetBar } from "../charts";
import { billsByCat, budgetRows, monthSummary, spendByCat, upcoming } from "../core/money";
import { MODELS } from "../core/models";
import { WIDE } from "../../ui/hooks";
import { RANGES, slice, useHub, type Range } from "../useHub";
import type { Point } from "../data/history.sample";

export const dayLabel = (n: number) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : "In " + n + " days");

/** The value, its change over the selected range, and the chart. Hovering the chart scrubs the headline. */
export function Hero({ label, points, range, setRange, sub }: { label: string; points: Point[]; range: Range; setRange: (r: Range) => void; sub?: string }) {
  const [hover, setHover] = useState<Point | null>(null);
  const pts = slice(points, range);
  const end = hover || pts[pts.length - 1], start = pts[0];
  const chg = end.v - start.v, pc = start.v ? (chg / Math.abs(start.v)) * 100 : 0;
  const rl = RANGES.find((r) => r.v === range)!;
  return (
    <Card className="hub-hero">
      <div className="hero-head">
        <div>
          <Label>{label}</Label>
          <div className="hero-val num">{fmt(end.v)}</div>
          <div className={cls("hero-chg num", chg >= 0 ? "pos" : "neg")}>
            {chg >= 0 ? "▲ +" : "▼ −"}{fmt(Math.abs(chg))} ({signed(pc, 2)}) <span className="muted">{hover ? "since " + start.t.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : rl.v === "all" ? "all time" : "past " + rl.l}</span>
          </div>
          {sub && <div className="muted small">{sub}</div>}
        </div>
        <Seg size="sm" label="Range" value={range} onChange={setRange} options={RANGES.map((r) => ({ v: r.v, l: r.l }))} />
      </div>
      <TrendChart points={pts} onHover={setHover} />
    </Card>
  );
}

export default function Home({ go }: { go: (p: string) => void }) {
  const h = useHub();
  const [range, setRange] = useState<Range>("1y");
  const sum = monthSummary(h.money, h.today);
  const rows = budgetRows(h.money.budgets, spendByCat(h.money.txns, sum.month), sum.frac, billsByCat(h.money.bills, h.today));
  const bills = upcoming(h.money.bills, h.today, 10);
  const base = MODELS[0].run!({ holdings: h.desk.holdings, sim: h.desk.sim, accounts: PROFILE.accounts, horizon: h.desk.horizon, shock: h.desk.shock });
  const flagged = rows.filter((r) => r.tone !== "ok");
  const shown = useMemo(() => [...flagged, ...rows.filter((r) => r.tone === "ok")].slice(0, 5), [rows, flagged]);
  const debts = h.money.accounts.filter((a) => a.kind === "credit" || a.kind === "loan");
  const cashAccts = h.money.accounts.filter((a) => a.kind === "checking" || a.kind === "savings");

  return (
    <div className="home">
      <div className="home-l">
        <Hero label="Net worth" points={h.nwHistory} range={range} setRange={setRange} sub={"Investments " + fmtK(h.invest) + " · cash less debts " + fmtK(h.cash)} />
        <div className="home-sub">
          <Card pad={false} className="pad-t">
            <div className="pad-x"><Label right={<button type="button" className="link" onClick={() => go("/budget")}>All categories</button>}>Budget this month</Label></div>
            <ul className="brows">
              {shown.map((r) => (
                <li key={r.cat}>
                  <div className="br-top"><span>{r.cat}</span><span className="num">{fmt(r.spent)} <span className="muted">of {fmt(r.limit)}</span></span></div>
                  <BudgetBar pct={r.pct} frac={r.limit ? r.expected / r.limit : 0} tone={r.tone} />
                  {r.tone !== "ok" && <span className={cls("small", r.tone === "bad" ? "neg" : "warn")}>{r.note}</span>}
                </li>
              ))}
            </ul>
          </Card>
            <div className="stack">
            <Card pad={false} className="pad-t">
              <div className="pad-x"><Label right={<span className="muted small num">{fmt(bills.reduce((s, b) => s + b.amt, 0))}</span>}>Upcoming bills · 10 days</Label></div>
              <ul className="list bills">
                {bills.length === 0 && <li className="pad-x pad-b muted small">Nothing due in the next 10 days.</li>}
                {bills.map((b) => (
                  <li key={b.n} className="bill">
                    <span className="cal"><b>{b.date.getDate()}</b><i>{b.date.toLocaleDateString("en-US", { month: "short" })}</i></span>
                    <span className="li-mid"><span>{b.n}</span><span className="muted small">{dayLabel(b.inDays)} · {b.cat}</span></span>
                    <span className="num">{fmt(b.amt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card pad={false} className="pad-t">
              <div className="pad-x"><Label>Accounts</Label></div>
              <AcctGroup title="Cash" total={cashAccts.reduce((s, a) => s + a.bal, 0)} rows={cashAccts.map((a) => [a.n, a.bal])} />
              <AcctGroup title="Investments" total={h.invest} rows={PROFILE.accounts.map((a) => [a.n, acctBal(h.desk.holdings, a.k)])} onClick={() => go("/invest")} />
              <AcctGroup title="Credit and loans" total={-debts.reduce((s, a) => s + a.bal, 0)} rows={debts.map((a) => [a.n, -a.bal])} />
            </Card>
            </div>
        </div>
      </div>
      <div className="home-r">
        <Card className="sts">
          <Label tip="Expected take-home pay this month, less what you've spent, bills still due this month and planned goal savings.">Safe to spend</Label>
          <div className="big num">{fmt(sum.safeToSpend)}</div>
          <div className="muted small">About <b className="num">{fmt(sum.perDay)}</b> a day for the next {sum.daysLeft} days</div>
          <div className="kpis">
            <KpiRow k="Take-home pay" v={fmt(Math.max(sum.income, h.money.income))} />
            <KpiRow k="Spent so far" v={"−" + fmt(sum.spent)} />
            <KpiRow k="Bills still due" v={"−" + fmt(sum.billsLeft)} />
            <KpiRow k="Goal savings" v={"−" + fmt(sum.goalsMo)} />
          </div>
          <button type="button" className="link" onClick={() => go("/budget")}>Open budget →</button>
        </Card>
        <Card className="fc-teaser" onClick={() => go("/forecast")}>
          <Label right={<span className="pill">Baseline model</span>}>Forecast</Label>
          {base && (
            <>
              <div className="snap-row">
                <div><div className="big num">{fmtK(base.median[base.median.length - 1])}</div><div className="muted small">median in {h.desk.horizon} years</div></div>
                <div className="ta-r small muted">Range<br /><span className="num">{fmtK(base.low[base.low.length - 1])} – {fmtK(base.high[base.high.length - 1])}</span></div>
              </div>
              <ProjectionChart median={base.median} low={base.low} high={base.high} height={140} />
            </>
          )}
          <span className="muted small">{MODELS.filter((m) => m.status === "planned").length} model slots ready for the models you build →</span>
        </Card>
      </div>
    </div>
  );
}

function AcctGroup({ title, total, rows, onClick }: { title: string; total: number; rows: [string, number][]; onClick?: () => void }) {
  const [open, setOpen] = useState(() => matchMedia(WIDE).matches);
  return (
    <div className="agroup">
      <button type="button" className="acct-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className={cls("chev", open && "open")}>›</span>
        <span className="acct-name">{title}</span>
        <span className={cls("acct-bal num", total < 0 && "neg")}>{total < 0 ? "−" + fmt(-total) : fmt(total)}</span>
      </button>
      {open && (
        <ul className="list">
          {rows.map(([n, v]) => <li key={n} className="arow"><span>{n}</span><span className={cls("num", v < 0 && "neg")}>{v < 0 ? "−" + fmt(-v) : fmt(v)}</span></li>)}
          {onClick && <li className="arow"><button type="button" className="link" onClick={onClick}>Positions and returns →</button></li>}
        </ul>
      )}
    </div>
  );
}
