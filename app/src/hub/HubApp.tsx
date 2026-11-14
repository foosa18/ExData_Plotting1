import { useEffect } from "react";
import { DeskProvider } from "../store";
import { useRoute, useTheme } from "../App";
import Today from "../screens/Today";
import Portfolio from "../screens/Portfolio";
import Options from "../screens/Options";
import Plan from "../screens/Plan";
import Home from "./screens/Home";
import Budget from "./screens/Budget";
import Invest from "./screens/Invest";
import Forecast from "./screens/Forecast";
import More from "./screens/More";
import { HubIcon } from "./icons";
import { Icon } from "../ui/kit";
import { cls } from "../ui/format";
import { useMedia, WIDE } from "../ui/hooks";
import { platform } from "../platform";
import { setFlag } from "../flags";
import "./hub.css";

// Finance hub shell (mini project 1). Its own navigation; the alpha screens are reused unchanged under Tools.
type Page = { k: string; l: string; sub: string; group: "main" | "tools" };
const PAGES: Page[] = [
  { k: "home", l: "Home", sub: "Net worth, this month's money and what's coming up", group: "main" },
  { k: "budget", l: "Budget", sub: "Spending against plan, bills, cash flow and goals", group: "main" },
  { k: "invest", l: "Invest", sub: "Accounts, positions and returns across every brokerage account", group: "main" },
  { k: "forecast", l: "Forecast", sub: "Projections from the baseline and from the models you add", group: "main" },
  { k: "today", l: "Market day", sub: "Routine, portfolio and ideas at a glance", group: "tools" },
  { k: "portfolio", l: "Allocation desk", sub: "Holdings, simulator and projection", group: "tools" },
  { k: "options", l: "Options screener", sub: "ATM contract screener for 30–90 DTE premium buying", group: "tools" },
  { k: "plan", l: "Framework", sub: "Framework, workplan and decisions", group: "tools" },
  { k: "more", l: "More", sub: "Tools and settings", group: "tools" },
];
const TAB_KEYS = ["home", "budget", "invest", "forecast", "more"];

export function leaveHub() {
  setFlag("hub", false);
  location.href = location.pathname + location.search.replace(/([?&])hub=1&?/, "$1").replace(/[?&]$/, "") + "#/today";
}

export default function HubApp() {
  const [parts, go] = useRoute();
  const wide = useMedia(WIDE);
  const [theme, cycleTheme] = useTheme();
  const page = PAGES.find((p) => p.k === parts[0]) || PAGES[0];
  useEffect(() => { document.documentElement.dataset.platform = platform; }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [page.k]);
  const activeTab = TAB_KEYS.includes(page.k) ? page.k : "more";

  const screen = (
    <>
      {page.k === "home" && <Home go={go} />}
      {page.k === "budget" && <Budget view={parts[1] || "month"} go={go} />}
      {page.k === "invest" && <Invest view={parts[1] || "overview"} go={go} />}
      {page.k === "forecast" && <Forecast model={parts[1] || "baseline"} go={go} />}
      {page.k === "more" && <More pages={PAGES.filter((p) => p.group === "tools" && p.k !== "more")} />}
      {page.k === "today" && <Today go={go} />}
      {page.k === "portfolio" && <Portfolio />}
      {page.k === "options" && <Options openTicker={parts[1]} go={go} />}
      {page.k === "plan" && <Plan section={parts[1] || "overview"} go={go} />}
    </>
  );
  const themeBtn = (
    <button type="button" className="icon-btn" onClick={cycleTheme} aria-label={"Theme: " + theme + ". Change theme"} title={"Theme: " + theme}>
      <Icon name={theme === "auto" ? "auto" : theme === "light" ? "sun" : "moon"} />
    </button>
  );
  const link = (p: Page) => (
    <a key={p.k} href={"#/" + p.k} className={cls("side-link", page.k === p.k && "on")} aria-current={page.k === p.k ? "page" : undefined}>
      <HubIcon name={p.k} /> {p.l}
    </a>
  );

  return (
    <DeskProvider>
      <div className={cls("shell hub", wide ? "shell-wide" : "shell-app")}>
        {wide && (
          <aside className="side">
            <div className="brand"><img src="./icon.svg" alt="" width={28} height={28} /><b>Investing</b><span className="beta">Hub</span></div>
            <nav aria-label="Main">{PAGES.filter((p) => p.group === "main").map(link)}</nav>
            <div className="side-group">
              <span className="eyebrow">Tools</span>
              <nav aria-label="Tools">{PAGES.filter((p) => p.group === "tools" && p.k !== "more").map(link)}</nav>
            </div>
            <div className="side-foot">
              {themeBtn}
              <button type="button" className="link small" onClick={leaveHub}>Back to alpha</button>
            </div>
          </aside>
        )}
        <div className="main">
          <header className="top">
            <div>
              <h1>{page.l}</h1>
              {wide && <p className="sub">{page.sub}</p>}
            </div>
            {!wide && themeBtn}
          </header>
          <div className="sample-note" role="note"><Icon name="info" size={16} /> Preview on sample data until your bank and brokerage accounts are connected.</div>
          <main className="content" id="content">{screen}</main>
          {!wide && <p className="disclaimer muted small">Not investment advice.</p>}
        </div>
        {!wide && (
          <nav className="tabbar hub-tabs" aria-label="Main">
            {TAB_KEYS.map((k) => { const p = PAGES.find((x) => x.k === k)!; return (
              <a key={k} href={"#/" + k} className={cls(activeTab === k && "on")} aria-current={activeTab === k ? "page" : undefined}>
                <HubIcon name={k} size={22} /><span>{p.l}</span>
              </a>
            ); })}
          </nav>
        )}
      </div>
    </DeskProvider>
  );
}
