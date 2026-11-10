import { DECISIONS, KPIS, PHASES, PILLARS, ROUTINE, UNIVERSE, VISION, WORKSTREAMS } from "../core/plan";
import { Card, Label } from "../ui/kit";
import { cls } from "../ui/format";

export const PLAN_SECTIONS = [
  { k: "overview", l: "Vision" }, { k: "workstreams", l: "Workstreams" }, { k: "workplan", l: "Workplan" },
  { k: "routine", l: "Daily routine" }, { k: "kpis", l: "KPIs" }, { k: "universe", l: "Universe" }, { k: "decisions", l: "Decisions" },
] as const;

export default function Plan({ section, go }: { section: string; go: (p: string) => void }) {
  const cur = PLAN_SECTIONS.some((s) => s.k === section) ? section : "overview";
  return (
    <div className="stack">
      <nav className="chips scroll-x" aria-label="Plan sections">
        {PLAN_SECTIONS.map((s) => <button key={s.k} type="button" className={cls("chip", cur === s.k && "on")} aria-current={cur === s.k ? "page" : undefined} onClick={() => go("/plan/" + s.k)}>{s.l}</button>)}
      </nav>
      {cur === "overview" && (
        <>
          <Card className="vision"><Label>Project vision</Label><p className="lede">{VISION}</p></Card>
          <div className="grid-2">{PILLARS.map(([t, d]) => <Card key={t}><b>{t}</b><p className="muted small">{d}</p></Card>)}</div>
        </>
      )}
      {cur === "workstreams" && (
        <div className="grid-auto">
          {WORKSTREAMS.map((w) => (
            <Card key={w.id} className="ws">
              <div className="ws-top"><b>{w.name}</b><span className="mono accent">{w.id}</span></div>
              <span className="muted small">Owner: {w.owner}</span>
              <ul>{w.items.map((i) => <li key={i}>{i}</li>)}</ul>
              <p className="q small muted">{w.q}</p>
            </Card>
          ))}
        </div>
      )}
      {cur === "workplan" && (
        <>
          <Card>
            <Label>20-week plan</Label>
            <div className="gantt" role="img" aria-label="Five phases across 20 weeks">
              {PHASES.map((p) => (
                <div className="g-row" key={p.n}>
                  <span className="small">P{p.n} {p.name}</span>
                  <span className="g-track"><i className={"ph" + p.n} style={{ left: ((p.start - 1) / 20) * 100 + "%", width: ((p.end - p.start + 1) / 20) * 100 + "%" }} /></span>
                </div>
              ))}
              <div className="g-row g-axis"><span /><span className="g-track mono">{[1, 5, 9, 13, 17].map((w) => <em key={w} style={{ left: ((w - 1) / 20) * 100 + "%" }}>W{w}</em>)}</span></div>
            </div>
          </Card>
          {PHASES.map((p) => (
            <Card key={p.n} className={"phase ph-b" + p.n}>
              <div className="ws-top"><b>Phase {p.n} · {p.name}</b><span className="mono muted small">{p.weeks}</span></div>
              <ul>{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
              <p className="small"><b>{p.gateLabel}:</b> <span className="muted">{p.gate}</span></p>
            </Card>
          ))}
        </>
      )}
      {cur === "routine" && (
        <Card pad={false}>
          <ol className="routine full">
            {ROUTINE.map((r, i) => (
              <li key={i} className={cls(r.key && "key")}>
                <span className="r-time num">{r.time}</span><span className="r-dot" aria-hidden="true" />
                <span className="r-body"><b>{r.title}</b><span className="muted">{r.detail}</span></span>
                <span className={cls("r-who", r.who === "You" || r.who === "You approve" ? "you" : r.who === "Deadline" ? "dl" : "")}>{r.who}</span>
              </li>
            ))}
          </ol>
          <div className="callout m"><b>Regulatory check before go-live</b><span>Selling part of a position bought the same day is a day trade. Frequent day trading in a margin account triggers pattern-day-trader rules; in a cash account proceeds must settle (T+1) before reuse.</span></div>
        </Card>
      )}
      {cur === "kpis" && KPIS.map((g) => (
        <Card key={g.group} pad={false}>
          <div className="pad-x pad-t"><Label>{g.group}</Label></div>
          <ul className="list">{g.items.map((k) => (
            <li key={k.m} className="kpi-li">
              <span className="li-mid"><b>{k.m}</b><span className="muted small">{k.what} · {k.refresh}</span></span>
              <span className="kpi-tags"><span className={"cx cx-" + k.cx}>{k.cx}</span>{k.use.map((u) => <span key={u} className="use">{u}</span>)}</span>
            </li>
          ))}</ul>
        </Card>
      ))}
      {cur === "universe" && (
        <>
          <p className="muted body">Classify by value-chain position, so every name is compared with its true peers. Sector → Industry → Sub-segment → Ticker.</p>
          <div className="grid-auto">
            {UNIVERSE.map((u) => (
              <Card key={u.industry} pad={false}>
                <div className="pad-x pad-t ws-top"><b>{u.industry}</b><span className="mono muted small">vs {u.bench}</span></div>
                <ul className="list">{u.subs.map(([s, r, t]) => <li key={s} className="kpi-li"><span className="li-mid"><b>{s}</b><span className="muted small">{r}</span></span><span className="mono small">{t}</span></li>)}</ul>
              </Card>
            ))}
          </div>
        </>
      )}
      {cur === "decisions" && (
        <>
          <p className="muted body">D1–D4 block Phase 1 and should be settled in week 1–2.</p>
          {DECISIONS.map((d) => (
            <Card key={d.id} className="dec">
              <div className="ws-top"><b><span className="mono muted">{d.id}</span> {d.q}</b><span className="pill">{d.when}</span></div>
              <p className="small muted">{d.options}</p>
              <p className="small"><b className="accent">Recommendation:</b> {d.rec}</p>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
