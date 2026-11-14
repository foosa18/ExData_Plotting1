import { useMemo, useState } from "react";
import { Card, Chip, KpiRow, Label, Seg, Stat } from "../../ui/kit";
import { PROFILE } from "../../data/profile";
import { cls, fmt, fmtK } from "../../ui/format";
import { BudgetBar, NetBars } from "../charts";
import { billsByCat, budgetRows, cashFlow, goalMonths, monthSummary, spendByCat, upcoming, type Cat } from "../core/money";
import { useHub } from "../useHub";
import { dayLabel } from "./Home";

const VIEWS = [{ v: "month", l: "This month" }, { v: "transactions", l: "Transactions" }, { v: "plan", l: "Goals and plan" }];

export default function Budget({ view, go }: { view: string; go: (p: string) => void }) {
  return (
    <div className="stack">
      <Seg label="Budget view" value={view} onChange={(v) => go("/budget/" + v)} options={VIEWS} />
      {view === "transactions" ? <Transactions /> : view === "plan" ? <PlanView /> : <Month />}
    </div>
  );
}

function Month() {
  const h = useHub();
  const sum = monthSummary(h.money, h.today);
  const rows = budgetRows(h.money.budgets, spendByCat(h.money.txns, sum.month), sum.frac, billsByCat(h.money.bills, h.today));
  const flow = cashFlow(h.money.txns, h.today, 6);
  const bills = upcoming(h.money.bills, h.today, 30);
  const mname = h.today.toLocaleDateString("en-US", { month: "long" });
  return (
    <>
      <div className="stats">
        <Stat label={"Income · " + mname} value={fmt(sum.income)} sub={"of " + fmt(h.money.income) + " expected"} />
        <Stat label="Spent" value={fmt(sum.spent)} sub={Math.round((sum.spent / sum.budgeted) * 100) + "% of " + fmt(sum.budgeted) + " budget"} />
        <Stat label="Bills still due" value={fmt(sum.billsLeft)} sub={bills.filter((b) => b.date.getMonth() === h.today.getMonth()).length + " this month"} />
        <Stat label="Safe to spend" value={fmt(sum.safeToSpend)} sub={fmt(sum.perDay) + " a day"} tone="accent" />
      </div>
      <div className="hub-grid budget">
        <Card pad={false} className="pad-t">
          <div className="pad-x">
            <Label tip="The tick marks where spending should be by today: bills already due in full, plus the rest of the limit spread over the month. A bar past its tick is ahead of pace.">Categories</Label>
          </div>
          <ul className="brows">
            {rows.map((r) => (
              <li key={r.cat}>
                <div className="br-top"><span>{r.cat}</span><span className="num">{fmt(r.spent)} <span className="muted">of {fmt(r.limit)}</span></span></div>
                <BudgetBar pct={r.pct} frac={r.limit ? r.expected / r.limit : 0} tone={r.tone} />
                <span className={cls("small", r.tone === "bad" ? "neg" : r.tone === "warn" ? "warn" : "muted")}>{r.tone === "ok" ? fmt(Math.max(0, r.left)) + " left" : r.note}</span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="stack">
          <Card>
            <Label right={<span className="muted small">last 6 months</span>}>Net saved</Label>
            <NetBars rows={flow.map((f) => ({ label: new Date(f.month + "-01T12:00").toLocaleDateString("en-US", { month: "short" }), net: f.net, income: f.income, spent: f.spent }))} partial />
            <span className="muted small">The last bar is this month so far. Transfers to savings are not counted as spending.</span>
          </Card>
          <Card pad={false} className="pad-t">
            <div className="pad-x"><Label right={<span className="muted small num">{fmt(bills.reduce((s, b) => s + b.amt, 0))}</span>}>Recurring · next 30 days</Label></div>
            <ul className="list bills">
              {bills.map((b) => (
                <li key={b.n} className="bill">
                  <span className="cal"><b>{b.date.getDate()}</b><i>{b.date.toLocaleDateString("en-US", { month: "short" })}</i></span>
                  <span className="li-mid"><span>{b.n}</span><span className="muted small">{dayLabel(b.inDays)} · {b.cat}</span></span>
                  <span className="num">{fmt(b.amt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function Transactions() {
  const h = useHub();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat | "All">("All");
  const cats = useMemo(() => ["All", ...Array.from(new Set(h.money.txns.map((t) => t.cat))).sort()] as (Cat | "All")[], [h.money.txns]);
  const acctName = (k: string) => h.money.accounts.find((a) => a.k === k)?.n || k;
  const list = h.money.txns.filter((t) => (cat === "All" || t.cat === cat) && (!q || t.payee.toLowerCase().includes(q.toLowerCase()))).slice(0, 150);
  const byDay = useMemo(() => {
    const m = new Map<string, typeof list>();
    list.forEach((t) => m.set(t.d, [...(m.get(t.d) || []), t]));
    return Array.from(m.entries());
  }, [list]);
  return (
    <Card pad={false} className="pad-t">
      <div className="pad-x stack">
        <label className="search"><span aria-hidden="true">⌕</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search payee" aria-label="Search payee" /></label>
        <div className="chips scroll-x">{cats.map((c) => <Chip key={c} on={c === cat} onClick={() => setCat(c)}>{c}</Chip>)}</div>
      </div>
      <div className="txns">
        {byDay.length === 0 && <p className="pad-x pad-b muted">No transactions match.</p>}
        {byDay.map(([d, ts]) => (
          <section key={d}>
            <h3 className="txd">{new Date(d + "T12:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</h3>
            <ul className="list">
              {ts.map((t, i) => (
                <li key={i} className="tx">
                  <span className="tx-av" aria-hidden="true">{t.payee[0]}</span>
                  <span className="li-mid"><span>{t.payee}</span><span className="muted small">{t.cat} · {acctName(t.acct)}</span></span>
                  <span className={cls("num", t.amt > 0 && "pos")}>{t.amt > 0 ? "+" + fmt(t.amt) : "−" + fmt(-t.amt)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  );
}

function PlanView() {
  const h = useHub();
  const flow = cashFlow(h.money.txns, h.today, 6).slice(0, 5); // full months only
  const avgIn = flow.reduce((s, f) => s + f.income, 0) / flow.length;
  const avgOut = flow.reduce((s, f) => s + f.spent, 0) / flow.length;
  const savings = h.money.accounts.filter((a) => a.kind === "savings").reduce((s, a) => s + a.bal, 0);
  const rate = avgIn ? (avgIn - avgOut) / avgIn : 0;
  return (
    <div className="hub-grid budget">
      <Card pad={false} className="pad-t">
        <div className="pad-x"><Label>Goals</Label></div>
        <ul className="goals">
          {h.money.goals.map((g) => {
            const m = goalMonths(g), pct = g.saved / g.target;
            const eta = isFinite(m) ? new Date(h.today.getFullYear(), h.today.getMonth() + m, 1) : null;
            const late = eta && g.by && eta.toISOString().slice(0, 7) > g.by;
            return (
              <li key={g.n}>
                <div className="br-top"><b>{g.n}</b><span className="num">{fmtK(g.saved)} <span className="muted">of {fmtK(g.target)}</span></span></div>
                <span className="gbar"><i style={{ width: Math.min(100, pct * 100) + "%" }} /></span>
                <span className={cls("small", late ? "warn" : "muted")}>
                  {fmt(g.mo)}/month · {eta ? "reached " + eta.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "no contribution set"}
                  {late && " · after the " + new Date(g.by + "-01T12:00").toLocaleDateString("en-US", { month: "short", year: "numeric" }) + " target"}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card>
        <Label>Plan health</Label>
        <div className="kpis">
          <KpiRow k="Average take-home" v={fmt(avgIn)} tip="Average of the last five full months." />
          <KpiRow k="Average spending" v={fmt(avgOut)} />
          <KpiRow k="Savings rate" v={Math.round(rate * 100) + "%"} tone={rate >= 0.2 ? "pos" : rate >= 0.1 ? "warn" : "neg"} tip="Share of take-home pay not spent, before transfers to savings and investing." />
          <KpiRow k="Emergency cover" v={(savings / avgOut).toFixed(1) + " months"} tone={savings / avgOut >= 6 ? "pos" : "warn"} tip="High-yield savings divided by average monthly spending. Six months is the usual target." />
          <KpiRow k="Investing each month" v={fmt(PROFILE.accounts.reduce((s, a) => s + a.mo, 0))} tip="Monthly contributions set on your investment accounts." />
        </div>
        <span className="muted small">Bank and card data arrive in mini project 2: CSV import first, live connections after.</span>
      </Card>
    </div>
  );
}
