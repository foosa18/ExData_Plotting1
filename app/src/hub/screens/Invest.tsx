import { useMemo, useState } from "react";
import { PROFILE } from "../../data/profile";
import { acctBal, F, holdingReturn, portfolioXirr, PERIODS, type Period } from "../../core/desk";
import { ACCOUNT_COLORS } from "../../core/desk";
import { useDesk } from "../../store";
import { AccountBar } from "../../ui/charts";
import { Card, Label, Seg, Stat } from "../../ui/kit";
import { cls, fmt, signed } from "../../ui/format";
import { useHub, type Range } from "../useHub";
import { Hero } from "./Home";

const groupOf = (tax: string) => (/education/i.test(tax) ? "Education" : /taxable/i.test(tax) ? "Taxable" : "Retirement");
const VIEWS = [{ v: "overview", l: "Overview" }, { v: "positions", l: "Positions" }];

type Col = "t" | "acct" | "val" | "w" | "ret" | "er";

export default function Invest({ view, go }: { view: string; go: (p: string) => void }) {
  const h = useHub();
  const { s, d } = useDesk();
  const [range, setRange] = useState<Range>("1y");
  const x = portfolioXirr(s.holdings, PROFILE.accounts, s.xirrPeriod);
  const total = h.invest;
  const monthly = PROFILE.accounts.reduce((a, b) => a + b.mo, 0);

  return (
    <div className="stack">
      <div className="toolbar">
        <Seg label="Invest view" value={view} onChange={(v) => go("/invest/" + v)} options={VIEWS} />
        <button type="button" className="btn" onClick={() => go("/portfolio")}>Open allocation desk →</button>
      </div>
      <div className="hub-grid invest">
        <Hero label="Investments" points={h.invHistory} range={range} setRange={setRange} sub={PROFILE.label + " · read-only, trading not connected"} />
        <div className="stack">
          <div className="stats stats-2">
            <Stat label={"Money-weighted · " + PERIODS[s.xirrPeriod][2]} value={x.xirr === null ? "—" : signed(x.xirr)} sub={x.used + " of " + x.total + " holdings"} tone={x.xirr !== null && x.xirr < 0 ? "neg" : "pos"} />
            <Stat label="Monthly contributions" value={fmt(monthly)} sub={fmt(monthly * 12) + " a year"} />
          </div>
          <Seg size="sm" label="Return period" value={s.xirrPeriod} onChange={(v: Period) => d({ type: "set", patch: { xirrPeriod: v } })} options={(Object.keys(PERIODS) as Period[]).map((k) => ({ v: k, l: PERIODS[k][2] }))} />
          <Card>
            <Label>Where it's held</Label>
            <AccountBar accounts={PROFILE.accounts} bal={(k) => acctBal(s.holdings, k)} total={total} />
          </Card>
        </div>
      </div>
      {view === "positions" ? <Positions /> : <Accounts />}
    </div>
  );
}

function Accounts() {
  const { s } = useDesk();
  const total = PROFILE.accounts.reduce((a, b) => a + acctBal(s.holdings, b.k), 0);
  const groups = ["Retirement", "Taxable", "Education"].map((g) => ({ g, accts: PROFILE.accounts.filter((a) => groupOf(a.tax) === g) })).filter((x) => x.accts.length);
  return (
    <Card pad={false} className="table-card">
      <div className="hscroll">
        <table className="tbl static">
          <thead><tr><th><span className="th">Account</span></th><th><span className="th">Tax treatment</span></th><th className="r"><span className="th">Positions</span></th><th className="r"><span className="th">Monthly</span></th><th className="r"><span className="th">Value</span></th><th className="r"><span className="th">Share</span></th></tr></thead>
          {groups.map(({ g, accts }) => {
            const gt = accts.reduce((a, b) => a + acctBal(s.holdings, b.k), 0);
            return (
              <tbody key={g}>
                <tr className="grp"><td colSpan={4}>{g}</td><td className="r num">{fmt(gt)}</td><td className="r num">{total ? Math.round((gt / total) * 100) : 0}%</td></tr>
                {accts.map((a) => {
                  const b = acctBal(s.holdings, a.k), i = PROFILE.accounts.indexOf(a);
                  return (
                    <tr key={a.k}>
                      <td><span className="swatch" style={{ background: ACCOUNT_COLORS[i] }} />{a.n}</td>
                      <td className="muted">{a.tax}</td>
                      <td className="r num">{(s.holdings[a.k] || []).length}</td>
                      <td className="r num">{a.mo ? fmt(a.mo) : "—"}</td>
                      <td className="r num">{fmt(b)}</td>
                      <td className="r num">{total ? ((b / total) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  );
                })}
              </tbody>
            );
          })}
        </table>
      </div>
    </Card>
  );
}

function Positions() {
  const { s } = useDesk();
  const [sort, setSort] = useState<[Col, 1 | -1]>(["val", -1]);
  const total = PROFILE.accounts.reduce((a, b) => a + acctBal(s.holdings, b.k), 0);
  const rows = useMemo(() => {
    const r = PROFILE.accounts.flatMap((a) => (s.holdings[a.k] || []).map(([t, val, mo]) => {
      const hr = holdingReturn(t, mo, s.xirrPeriod);
      return { t, n: F[t]?.n || t, acct: a.n, val, w: total ? (val / total) * 100 : 0, ret: hr ? hr.ann : null, er: F[t]?.er ?? null, mo };
    }));
    const [c, dir] = sort;
    return r.sort((a, b) => { const x = a[c] ?? -Infinity, y = b[c] ?? -Infinity; return (x < y ? -1 : x > y ? 1 : 0) * dir; });
  }, [s.holdings, s.xirrPeriod, sort, total]);
  const th = (c: Col, l: string, r = true) => (
    <th className={cls(r && "r")} aria-sort={sort[0] === c ? (sort[1] > 0 ? "ascending" : "descending") : undefined}>
      <button type="button" onClick={() => setSort([c, sort[0] === c ? (-sort[1] as 1 | -1) : c === "t" || c === "acct" ? 1 : -1])}>{l}</button>
    </th>
  );
  return (
    <Card pad={false} className="table-card">
      <div className="hscroll">
        <table className="tbl static">
          <thead><tr>{th("t", "Symbol", false)}{th("acct", "Account", false)}{th("val", "Value")}{th("w", "Weight")}{th("ret", "Return / yr · " + PERIODS[s.xirrPeriod][2])}{th("er", "Expense")}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.t + r.acct + i}>
                <td><span className="tick">{r.t}</span><span className="muted small pos-name">{r.n}</span></td>
                <td className="muted">{r.acct}</td>
                <td className="r num">{fmt(r.val)}</td>
                <td className="r num">{r.w.toFixed(1)}%</td>
                <td className={cls("r num", r.ret === null ? "na" : r.ret >= 0 ? "pos" : "neg")}>{r.ret === null ? "n/a" : signed(r.ret)}</td>
                <td className="r num">{r.er === null ? "—" : r.er.toFixed(2) + "%"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="pad-x pad-b muted small">Values are cost amounts from your desk entries until a brokerage is connected (mini project 3). Returns use each fund's published history over the window you held it.</p>
    </Card>
  );
}
