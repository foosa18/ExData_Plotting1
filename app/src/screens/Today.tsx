import { useEffect, useMemo, useState } from "react";
import { useMedia, WIDE } from "../ui/hooks";
import { PROFILE } from "../data/profile";
import { acctBal, portfolioXirr, project, totalBal, verdicts, PERIODS } from "../core/desk";
import { runScreen, group } from "../core/screener";
import { DECISIONS, ROUTINE } from "../core/plan";
import { useDesk } from "../store";
import { AccountBar, Meter } from "../ui/charts";
import { Card, Flag, Icon, Label } from "../ui/kit";
import { cls, fmt, num, signed } from "../ui/format";
import { VerdictTag, BiasTag } from "./Options";

/** Current time in New York, as minutes after midnight plus weekday. */
function etNow(d: Date) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "numeric", hour12: false, weekday: "short" }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value || "";
  const h = +get("hour") % 24, m = +get("minute");
  return { min: h * 60 + m, wd: get("weekday"), label: String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") };
}
function marketState(min: number, wd: string) {
  if (wd === "Sat" || wd === "Sun") return { label: "Weekend", tone: "muted" };
  if (min >= 570 && min < 960) return { label: "Market open", tone: "pos" };
  if (min >= 240 && min < 570) return { label: "Pre-market", tone: "warn" };
  if (min >= 960 && min < 1200) return { label: "After hours", tone: "muted" };
  return { label: "Market closed", tone: "muted" };
}
const dur = (m: number) => (m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m");

export default function Today({ go }: { go: (path: string) => void }) {
  const { s } = useDesk();
  const wide = useMedia(WIDE);
  const [full, setFull] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const et = etNow(now);
  const mkt = marketState(et.min, et.wd);
  const weekend = et.wd === "Sat" || et.wd === "Sun";
  const cur = weekend ? -1 : ROUTINE.findIndex((r) => et.min >= r.start && et.min < Math.max(r.end, r.start + 5));
  const nextKey = weekend ? null : ROUTINE.find((r) => r.key && r.start > et.min);

  const total = totalBal(s.holdings, PROFILE.accounts);
  const x = portfolioXirr(s.holdings, PROFILE.accounts, s.xirrPeriod);
  const proj = project(s.holdings, s.sim, PROFILE.accounts, s.horizon, s.shock);
  const flags = proj ? verdicts(proj) : [];
  const screen = useMemo(() => runScreen(), []);
  const ideas = screen.rows.filter((r) => group(r.vc) === "buy").slice(0, 3);

  return (
    <div className="today">
      <section className="hero card pad">
        <div className="hero-top">
          <div>
            <div className="eyebrow">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
            <h2 className="hero-h">{nextKey ? <>{nextKey.title} in <span className="num">{dur(nextKey.start - et.min)}</span></> : weekend ? "Markets are closed for the weekend" : "Today's routine is done"}</h2>
          </div>
          <div className="hero-clock">
            <span className={cls("dotlbl", mkt.tone)}><i />{mkt.label}</span>
            <span className="num muted">{et.label} ET</span>
          </div>
        </div>
        <ol className="routine" aria-label="Daily routine">
          {ROUTINE.map((r, i) => ({ r, i })).filter(({ i }) => wide || full || cur < 0 || (i >= cur - 1 && i <= cur + 2)).map(({ r, i }) => (
            <li key={i} className={cls(r.key && "key", i === cur && "now", !weekend && et.min >= Math.max(r.end, r.start + 5) && "done")}>
              <span className="r-time num">{r.time}</span>
              <span className="r-dot" aria-hidden="true" />
              <span className="r-body"><b>{r.title}</b><span className="muted">{r.detail}</span></span>
              <span className={cls("r-who", r.who === "You" || r.who === "You approve" ? "you" : r.who === "Deadline" ? "dl" : "")}>{r.who}</span>
            </li>
          ))}
        </ol>
        {!wide && cur >= 0 && <button type="button" className="link routine-more" onClick={() => setFull(!full)}>{full ? "Show less" : "Show the full day"}</button>}
      </section>

      <div className="today-grid">
        <Card onClick={() => go("/portfolio")} className="snap">
          <Label right={<Icon name="chev" size={16} />}>Portfolio</Label>
          <div className="snap-row">
            <div><div className="big num">{fmt(total)}</div><div className="muted small">{PROFILE.label}</div></div>
            <div className="ta-r">
              <div className={cls("xirr num", x.xirr === null ? "na" : x.xirr >= 7 ? "pos" : x.xirr >= 0 ? "warn" : "neg")}>{x.xirr === null ? "—" : signed(x.xirr)}</div>
              <div className="muted small">XIRR · {PERIODS[s.xirrPeriod][2]}</div>
            </div>
          </div>
          <AccountBar accounts={PROFILE.accounts} bal={(k) => acctBal(s.holdings, k)} total={total} />
          {flags[0] && <Flag tone={flags[0].tone} title={flags[0].title} />}
        </Card>

        <Card className="ideas" pad={false}>
          <div className="pad-x pad-t"><Label right={<button type="button" className="link" onClick={() => go("/options")}>All {screen.rows.length}</button>} tip="Top contracts the Options Screener rates as buy premium. Demo universe until live chains are connected.">Options ideas</Label></div>
          <ul className="list">
            {ideas.map((r) => (
              <li key={r.ticker}>
                <button type="button" className="list-btn" onClick={() => go("/options/" + r.ticker)}>
                  <span className="tick-lg">{r.ticker}</span>
                  <span className="li-mid"><span className="mono small">{r.contract}</span><span className="li-tags"><BiasTag bias={r.bias} /><VerdictTag r={r} /></span></span>
                  <span className="li-score"><span className="num">{num(r.score, 1)}</span><Meter value={r.score} /></span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="decisions" pad={false}>
          <div className="pad-x pad-t"><Label right={<button type="button" className="link" onClick={() => go("/plan/decisions")}>All 10</button>}>Decisions to make first</Label></div>
          <ul className="list">
            {DECISIONS.slice(0, 4).map((d) => (
              <li key={d.id}>
                <button type="button" className="list-btn" onClick={() => go("/plan/decisions")}>
                  <span className="mono muted">{d.id}</span>
                  <span className="li-mid"><b>{d.q}</b><span className="muted small">{d.rec}</span></span>
                  <span className="pill">{d.when}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
