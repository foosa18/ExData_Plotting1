import { useState } from "react";
import { PROFILE } from "../../data/profile";
import { useDesk } from "../../store";
import { ProjectionChart } from "../../ui/charts";
import { Card, KpiRow, Label, NumField, Seg } from "../../ui/kit";
import { cls, fmtK } from "../../ui/format";
import { MODELS, MODEL_CONTRACT, type ForecastModel } from "../core/models";

export default function Forecast({ model, go }: { model: string; go: (p: string) => void }) {
  const m = MODELS.find((x) => x.id === model) || MODELS[0];
  return (
    <div className="hub-grid forecast">
      <Card pad={false} className="pad-t models">
        <div className="pad-x"><Label tip="Every model returns the same shape (a median path with a low-to-high range), so new models appear here without new screens.">Models</Label></div>
        <ul className="list">
          {MODELS.map((x) => (
            <li key={x.id}>
              <button type="button" className={cls("list-btn model-btn", x.id === m.id && "on")} aria-current={x.id === m.id ? "true" : undefined} onClick={() => go("/forecast/" + x.id)}>
                <span className="li-mid"><span>{x.name}</span><span className="muted small">{x.scope} · {x.cadence}</span></span>
                <span className={cls("status", x.status)}>{x.status === "live" ? "Live" : "Slot"}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      {m.run ? <LiveModel m={m} /> : <PlannedModel m={m} />}
    </div>
  );
}

function LiveModel({ m }: { m: ForecastModel }) {
  const { s, d } = useDesk();
  const [goal, setGoal] = useState(2000000);
  const f = m.run!({ holdings: s.holdings, sim: s.sim, accounts: PROFILE.accounts, horizon: s.horizon, shock: s.shock });
  if (!f) return <Card><p className="muted">Add holdings in the allocation desk to run this model.</p></Card>;
  const n = f.median.length - 1;
  const hit = f.median.findIndex((v) => v >= goal), hitLow = f.low.findIndex((v) => v >= goal);
  return (
    <div className="stack">
      <Card>
        <div className="lbl-row">
          <div><Label>{m.name}</Label><p className="muted small">{m.summary}</p></div>
        </div>
        <div className="proj-ctl">
          <Seg size="sm" label="Horizon in years" value={s.horizon} onChange={(v) => d({ type: "set", patch: { horizon: v } })} options={[10, 15, 20, 25, 30].map((v) => ({ v, l: v + "y" }))} />
          <Seg size="sm" label="Return case" value={s.shock} onChange={(v) => d({ type: "set", patch: { shock: v } })} options={[{ v: 0.85, l: "Pessimistic" }, { v: 1, l: "Base" }, { v: 1.15, l: "Optimistic" }]} />
        </div>
        <ProjectionChart median={f.median} low={f.low} high={f.high} height={230} />
        <div className="stats">
          <div className="stat"><span className="lbl">Median in {n} years</span><b className="num">{fmtK(f.median[n])}</b><span className="sub">{f.note}</span></div>
          <div className="stat"><span className="lbl">Low case</span><b className="num">{fmtK(f.low[n])}</b><span className="sub">3 points lower a year</span></div>
          <div className="stat"><span className="lbl">High case</span><b className="num">{fmtK(f.high[n])}</b><span className="sub">2.5 points higher a year</span></div>
          <div className="stat"><span className="lbl">Today</span><b className="num">{fmtK(f.median[0])}</b><span className="sub">invested now</span></div>
        </div>
      </Card>
      <Card>
        <Label>Goal check</Label>
        <div className="goal-row">
          <span className="small">Target</span>
          <NumField label="Target amount" value={goal} onCommit={setGoal} prefix="$" step={50000} width={160} />
        </div>
        <div className="kpis">
          <KpiRow k="Median reaches it" v={hit < 0 ? "Not within " + n + " years" : "Year " + hit} tone={hit < 0 ? "warn" : "pos"} />
          <KpiRow k="Low case reaches it" v={hitLow < 0 ? "Not within " + n + " years" : "Year " + hitLow} tone={hitLow < 0 ? "warn" : "pos"} />
        </div>
      </Card>
    </div>
  );
}

function PlannedModel({ m }: { m: ForecastModel }) {
  return (
    <div className="stack">
      <Card>
        <Label right={<span className="status planned">Slot</span>}>{m.name}</Label>
        <p className="body">{m.summary}</p>
        <div className="kpis">
          <KpiRow k="Covers" v={m.scope} />
          <KpiRow k="Updates" v={m.cadence} />
        </div>
        <div className="empty-fan" aria-hidden="true"><svg viewBox="0 0 300 90" preserveAspectRatio="none"><path d="M0 60 L300 20 L300 80 Z" /><path d="M0 60 L300 50" /></svg></div>
        <p className="muted small">When this model runs, its forecast fan, signals and backtest appear here, next to the baseline.</p>
      </Card>
      <Card>
        <Label>How a model plugs in</Label>
        <ol className="steps">
          <li><b>Build it in Python</b> in the engine (repo <span className="mono">src/</span>), using any data and method.</li>
          <li><b>Publish a run</b> as one JSON file in the shape below.</li>
          <li><b>The app reads it</b> and shows the fan, signals and backtest. No new screens needed.</li>
        </ol>
        <pre className="contract mono">{MODEL_CONTRACT}</pre>
      </Card>
    </div>
  );
}
