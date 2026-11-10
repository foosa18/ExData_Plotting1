import { useMemo, useState } from "react";
import { PROFILE } from "../data/profile";
import { ACCOUNT_COLORS, F, PERIODS, TICKERS, acctBal, gaps, holdingReturn, portfolioXirr, project, totalBal, verdicts, type Period } from "../core/desk";
import { FUNDS } from "../core/funds";
import { useDesk } from "../store";
import { AccountBar, ProjectionChart } from "../ui/charts";
import { Card, Flag, Icon, KpiRow, Label, NumField, Seg, Sheet } from "../ui/kit";
import { cls, fmt, fmtK, pct, signed } from "../ui/format";
import { useMedia, WIDE } from "../ui/hooks";

const PERIOD_OPTS = (Object.keys(PERIODS) as Period[]).map((p) => ({ v: p, l: PERIODS[p][2] }));
type View = "holdings" | "simulator" | "projection";

export default function Portfolio() {
  const wide = useMedia(WIDE);
  const [view, setView] = useState<View>("holdings");
  if (wide) {
    return (
      <div className="desk-grid">
        <div className="stack"><Totals /><Holdings /><Gaps /></div>
        <div className="desk-right"><Simulator /><Projection /></div>
      </div>
    );
  }
  return (
    <div className="stack">
      <Totals />
      <Seg label="Portfolio view" value={view} onChange={setView} options={[{ v: "holdings", l: "Holdings" }, { v: "simulator", l: "Simulator" }, { v: "projection", l: "Projection" }]} />
      {view === "holdings" && <><Holdings /><Gaps /></>}
      {view === "simulator" && <Simulator />}
      {view === "projection" && <Projection />}
    </div>
  );
}

function Totals() {
  const { s, d } = useDesk();
  const total = totalBal(s.holdings, PROFILE.accounts);
  const x = portfolioXirr(s.holdings, PROFILE.accounts, s.xirrPeriod);
  return (
    <Card className="totals">
      <div className="snap-row">
        <div>
          <Label tip="Sum of every capital figure in your holdings. Editing any holding updates this total immediately.">Portfolio value</Label>
          <div className="big num">{fmt(total)}</div>
          <div className="muted small">{FUNDS.length} funds · {PROFILE.accounts.length} accounts · {PROFILE.label}</div>
        </div>
        <div className="ta-r">
          <Label tip="Money-weighted return solved across every holding's own entry date and value. Funds too young for the period are excluded entirely.">Portfolio XIRR</Label>
          <div className={cls("xirr num", x.xirr === null ? "na" : x.xirr >= 7 ? "pos" : x.xirr >= 0 ? "warn" : "neg")}>{x.xirr === null ? "—" : signed(x.xirr)}</div>
          <div className="muted small num">{x.used ? x.used + " of " + x.total + " funds eligible" : "no eligible funds"}</div>
        </div>
      </div>
      <Seg size="sm" label="XIRR period" value={s.xirrPeriod} onChange={(p) => d({ type: "set", patch: { xirrPeriod: p } })} options={PERIOD_OPTS} />
      <AccountBar accounts={PROFILE.accounts} bal={(k) => acctBal(s.holdings, k)} total={total} />
    </Card>
  );
}

function Holdings() {
  const { s, d } = useDesk();
  const [edit, setEdit] = useState<{ acct: string; i: number } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const row = edit ? s.holdings[edit.acct]?.[edit.i] : undefined;
  return (
    <Card pad={false}>
      <div className="pad-x pad-t">
        <Label tip="Tap a holding to swap the fund, edit its capital or set how long you have held it. Every field feeds the totals." right={
          <Seg size="sm" label="Return period" value={s.holdPeriod} onChange={(p) => d({ type: "set", patch: { holdPeriod: p } })} options={PERIOD_OPTS} />
        }>Current holdings</Label>
      </div>
      {PROFILE.accounts.map((a, ai) => {
        const rows = s.holdings[a.k] || [];
        const isClosed = closed[a.k];
        return (
          <section key={a.k} className="acct">
            <button type="button" className="acct-head" aria-expanded={!isClosed} onClick={() => setClosed({ ...closed, [a.k]: !isClosed })}>
              <i style={{ background: ACCOUNT_COLORS[ai] }} />
              <span className="acct-name">{a.n}</span>
              <span className="muted small">{a.tax}</span>
              <span className="num acct-bal">{fmt(acctBal(s.holdings, a.k))}</span>
              <span className={cls("chev", !isClosed && "open")}><Icon name="chev" size={16} /></span>
            </button>
            {!isClosed && (
              <ul className="list">
                {rows.map(([t, cap, mo], i) => {
                  const h = holdingReturn(t, mo, s.holdPeriod);
                  return (
                    <li key={i}>
                      <button type="button" className="list-btn hold" onClick={() => setEdit({ acct: a.k, i })}>
                        <span className="li-mid"><span className="tick">{t}{F[t] && !F[t].v && <span className="est" title="estimated return">·</span>}</span><span className="muted small">{F[t]?.c} · {mo} mo</span></span>
                        <span className="num">{fmt(cap)}</span>
                        <span className={cls("num ret", !h ? "na" : h.cum > 0 ? "pos" : h.cum < 0 ? "neg" : "na")}>{h ? signed(h.cum) : "—"}</span>
                      </button>
                    </li>
                  );
                })}
                <li><button type="button" className="list-btn add" onClick={() => setAdding(a.k)}><Icon name="plus" size={16} /> Add fund to {a.n}</button></li>
              </ul>
            )}
          </section>
        );
      })}
      <p className="muted small pad-x pad-b">New holdings start at $5,000 and 12 months. A dot marks an estimated return.</p>

      <Sheet open={!!row} onClose={() => setEdit(null)} title={row ? row[0] : ""}
        footer={edit && <button type="button" className="btn danger" onClick={() => { d({ type: "hold.del", acct: edit.acct, i: edit.i }); setEdit(null); }}><Icon name="trash" size={16} /> Remove holding</button>}>
        {row && edit && (
          <div className="stack">
            <label className="field">Fund
              <select value={row[0]} onChange={(e) => d({ type: "hold.set", acct: edit.acct, i: edit.i, row: [e.target.value, row[1], row[2]] })}>
                {TICKERS.map((t) => <option key={t} value={t}>{t} — {F[t].c}</option>)}
              </select>
            </label>
            <div className="field-row">
              <div className="field">Capital<NumField label="Capital invested" prefix="$" step={100} value={row[1]} onCommit={(n) => d({ type: "hold.set", acct: edit.acct, i: edit.i, row: [row[0], n, row[2]] })} /></div>
              <div className="field">Held<NumField label="Months held" suffix="mo" max={600} value={row[2]} onCommit={(n) => d({ type: "hold.set", acct: edit.acct, i: edit.i, row: [row[0], row[1], n] })} /></div>
            </div>
            <ReturnLine t={row[0]} mo={row[2]} period={s.holdPeriod} />
            <FundInfo t={row[0]} />
          </div>
        )}
      </Sheet>
      <FundPicker open={!!adding} title={"Add to " + (PROFILE.accounts.find((a) => a.k === adding)?.n || "")} onClose={() => setAdding(null)} onPick={(t) => { d({ type: "hold.add", acct: adding!, ticker: t }); setAdding(null); }} />
    </Card>
  );
}

function ReturnLine({ t, mo, period }: { t: string; mo: number; period: Period }) {
  const h = holdingReturn(t, mo, period);
  if (!h) return <Flag tone="warn" title="Not in the XIRR.">This fund did not exist for the whole {PERIODS[period][2]} period, so it is left out of the portfolio XIRR.</Flag>;
  return <div className="kpis"><KpiRow k={"Return (" + PERIODS[period][2] + ")"} v={signed(h.cum)} tone={h.cum >= 0 ? "pos" : "neg"} /><KpiRow k="Annualised XIRR" v={signed(h.ann)} /><KpiRow k="Years measured" v={h.yrs.toFixed(1)} /></div>;
}

function FundInfo({ t }: { t: string }) {
  const f = F[t];
  if (!f) return null;
  return (
    <div className="fund-info">
      <b>{f.n}</b>
      <span className="muted small">{f.i} · since {f.y} · {f.h.toLocaleString("en-US")} holdings · ER {f.er}% · yield {f.dy}%{f.v ? " · verified" : " · estimate"}</span>
      <p className="body">{f.usp}</p>
      <ul>{f.w.map((w) => <li key={w}>{w}</li>)}</ul>
      <span className="muted small">Suits: {f.a.join(", ")}</span>
    </div>
  );
}

function FundPicker({ open, onClose, onPick, title, exclude = [] }: { open: boolean; onClose: () => void; onPick: (t: string) => void; title: string; exclude?: string[] }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return FUNDS.filter((f) => !exclude.includes(f.t) && (!s || f.t.toLowerCase().includes(s) || f.n.toLowerCase().includes(s) || f.c.toLowerCase().includes(s))).sort((a, b) => a.t.localeCompare(b.t));
  }, [q, exclude]);
  return (
    <Sheet open={open} onClose={() => { setQ(""); onClose(); }} title={title}>
      <label className="search"><Icon name="search" size={16} /><input placeholder="Ticker, name or category" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search funds" /></label>
      <ul className="list picker">
        {list.map((f) => (
          <li key={f.t}><button type="button" className="list-btn" onClick={() => { setQ(""); onPick(f.t); }}>
            <span className="tick">{f.t}</span><span className="li-mid"><span>{f.n}</span><span className="muted small">{f.c} · ER {f.er}%</span></span>
          </button></li>
        ))}
      </ul>
    </Sheet>
  );
}

function Gaps() {
  const { s } = useDesk();
  const g = gaps(s.holdings, PROFILE.accounts, PROFILE.notes, PROFILE.bondBand);
  return (
    <Card>
      <Label tip="Account-level items outside fund selection that still change outcomes. Each is checked against your live holdings.">Not covered above</Label>
      <ul className="gaps">{g.map((x) => <li key={x.title}><b>{x.title}</b> <span className="muted">{x.detail}</span></li>)}</ul>
    </Card>
  );
}

function Simulator() {
  const { s, d } = useDesk();
  const [adding, setAdding] = useState<string | null>(null);
  return (
    <Card>
      <Label tip="Build a target mix per account as percentages. It runs against the account balances your holdings produce.">Simulator</Label>
      <div className="btn-row">
        <button type="button" className="btn ghost" onClick={() => d({ type: "reset" })}><Icon name="reset" size={15} /> Reset holdings</button>
        <button type="button" className="btn ghost" onClick={() => d({ type: "mirror" })}>Mirror holdings</button>
        <button type="button" className="btn primary" onClick={() => d({ type: "apply" })}>Apply recommended</button>
      </div>
      <div className="sim-grid">
        {PROFILE.accounts.map((a, ai) => {
          const list = s.sim[a.k] || [];
          const sum = list.reduce((x, r) => x + r[1], 0);
          return (
            <div className="sim-acct" key={a.k} style={{ borderTopColor: ACCOUNT_COLORS[ai] }}>
              <div className="sim-h"><b>{a.n}</b><span className="muted small">{fmtK(acctBal(s.holdings, a.k))} · {a.tax}</span></div>
              {list.map(([t, w], i) => (
                <div className="sim-row" key={t + i}>
                  <span className="tick" title={F[t]?.n}>{t}</span>
                  <NumField label={t + " weight"} suffix="%" max={100} value={w} width={84} onCommit={(n) => d({ type: "sim.weight", acct: a.k, i, w: n })} />
                  <button type="button" className="icon-btn sm" aria-label={"Remove " + t} onClick={() => d({ type: "sim.del", acct: a.k, i })}><Icon name="close" size={14} /></button>
                </div>
              ))}
              <div className="sim-foot">
                <button type="button" className="link" onClick={() => setAdding(a.k)}>+ Add fund</button>
                <span className={cls("num", sum === 100 ? "pos" : "warn")}>{sum}% allocated</span>
              </div>
            </div>
          );
        })}
      </div>
      <FundPicker open={!!adding} title={"Add to " + (PROFILE.accounts.find((a) => a.k === adding)?.n || "") + " mix"} exclude={(adding && s.sim[adding]?.map((x) => x[0])) || []}
        onClose={() => setAdding(null)} onPick={(t) => { d({ type: "sim.add", acct: adding!, ticker: t }); setAdding(null); }} />
    </Card>
  );
}

function Projection() {
  const { s, d } = useDesk();
  const c = project(s.holdings, s.sim, PROFILE.accounts, s.horizon, s.shock);
  return (
    <Card>
      <Label tip="Forward estimates built from asset-class assumptions, not past returns. Read the range as the answer.">Projection</Label>
      <div className="proj-ctl">
        <Seg size="sm" label="Horizon in years" value={s.horizon} onChange={(v) => d({ type: "set", patch: { horizon: v } })} options={[15, 20, 25, 30].map((v) => ({ v, l: v + "y" }))} />
        <Seg size="sm" label="Return case" value={s.shock} onChange={(v) => d({ type: "set", patch: { shock: v } })} options={[{ v: 0.85, l: "Pessimistic" }, { v: 1, l: "Base" }, { v: 1.15, l: "Optimistic" }]} />
      </div>
      {!c ? <Flag tone="bad" title="Nothing allocated in the simulator.">Add funds to at least one account.</Flag> : (
        <>
          <ProjectionChart median={c.median} low={c.low} high={c.high} />
          <div className="kpis">
            <KpiRow k="Value at horizon" v={fmtK(c.fv)} tip="Median projected balance including future contributions. Half of simulated outcomes land above it." />
            <KpiRow k="Range (10th–90th)" v={fmtK(c.lo) + " – " + fmtK(c.hi)} />
            <KpiRow k="Blended return" v={pct(c.r * 100, 2)} tip="Weighted expected return across the funds you selected, net of each fund's expense ratio." />
            <KpiRow k="Weighted fee" v={pct(c.feePct * 100, 3)} />
            <KpiRow k="Equity / bonds" v={Math.round(c.eq * 100) + " / " + Math.round(c.bd * 100)} />
            <KpiRow k="Est. worst drawdown" v={pct(c.dd * 100, 0)} tip="Approximate peak-to-trough fall in a 2008-style event. A stress estimate, not a forecast." />
            <KpiRow k="Funds held" v={c.n} />
          </div>
          {verdicts(c).map((v) => <Flag key={v.title} tone={v.tone} title={v.title}>{v.body}</Flag>)}
        </>
      )}
      <p className="muted small foot">Returns for VOO, VTI, QQQ, SCHD, VIG, SMH, XLK, BND and AGG are sourced figures as of 9–12 Oct 2026; others are estimates. Projections use forward asset-class assumptions and are illustrative, not predictive. Not investment advice.</p>
    </Card>
  );
}
