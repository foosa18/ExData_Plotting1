import { useCallback, useEffect, useState } from "react";
import { DeskProvider } from "./store";
import Today from "./screens/Today";
import Portfolio from "./screens/Portfolio";
import Options from "./screens/Options";
import Plan from "./screens/Plan";
import { Icon } from "./ui/kit";
import { cls } from "./ui/format";
import { useMedia, WIDE } from "./ui/hooks";
import { platform, syncStatusBar } from "./platform";

const TABS = [
  { k: "today", l: "Today", sub: "Routine, portfolio and ideas at a glance" },
  { k: "portfolio", l: "Portfolio", sub: "Allocation desk: holdings, simulator and projection" },
  { k: "options", l: "Options", sub: "ATM contract screener for 30–90 DTE premium buying" },
  { k: "plan", l: "Plan", sub: "Framework, workplan and decisions" },
] as const;

export function useRoute() {
  const read = () => (location.hash.replace(/^#/, "") || "/today").split("/").filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => { const on = () => setParts(read()); addEventListener("hashchange", on); return () => removeEventListener("hashchange", on); }, []);
  const go = useCallback((p: string) => { if (location.hash !== "#" + p) location.hash = p; }, []);
  return [parts, go] as const;
}

export type Theme = "auto" | "light" | "dark";
export function useTheme() {
  const [t, setT] = useState<Theme>(() => { try { return (localStorage.getItem("investing.theme") as Theme) || "auto"; } catch { return "auto"; } });
  const sysDark = useMedia("(prefers-color-scheme: dark)");
  useEffect(() => {
    const r = document.documentElement;
    if (t === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", t);
    try { localStorage.setItem("investing.theme", t); } catch { /* ignore */ }
    syncStatusBar(t === "dark" || (t === "auto" && sysDark));
  }, [t, sysDark]);
  return [t, () => setT(t === "auto" ? "light" : t === "light" ? "dark" : "auto")] as const;
}

export default function App() {
  const [parts, go] = useRoute();
  const wide = useMedia(WIDE);
  const [theme, cycleTheme] = useTheme();
  const tab = TABS.find((t) => t.k === parts[0]) || TABS[0];
  useEffect(() => { document.documentElement.dataset.platform = platform; }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [tab.k]);

  const screen = (
    <>
      {tab.k === "today" && <Today go={go} />}
      {tab.k === "portfolio" && <Portfolio />}
      {tab.k === "options" && <Options openTicker={parts[1]} go={go} />}
      {tab.k === "plan" && <Plan section={parts[1] || "overview"} go={go} />}
    </>
  );
  const themeBtn = (
    <button type="button" className="icon-btn" onClick={cycleTheme} aria-label={"Theme: " + theme + ". Change theme"} title={"Theme: " + theme}>
      <Icon name={theme === "auto" ? "auto" : theme === "light" ? "sun" : "moon"} />
    </button>
  );

  return (
    <DeskProvider>
      <div className={cls("shell", wide ? "shell-wide" : "shell-app")}>
        {wide ? (
          <aside className="side">
            <div className="brand"><img src="./icon.svg" alt="" width={28} height={28} /><b>Investing</b></div>
            <nav aria-label="Main">
              {TABS.map((t) => (
                <a key={t.k} href={"#/" + t.k} className={cls("side-link", tab.k === t.k && "on")} aria-current={tab.k === t.k ? "page" : undefined}>
                  <Icon name={t.k} /> {t.l}
                </a>
              ))}
            </nav>
            <div className="side-foot">{themeBtn}<span className="muted small">v0.1 · preview</span></div>
          </aside>
        ) : null}
        <div className="main">
          <header className="top">
            <div>
              <h1>{tab.l}</h1>
              {wide && <p className="sub">{tab.sub}</p>}
            </div>
            {!wide && themeBtn}
          </header>
          <main className="content" id="content">{screen}</main>
          {!wide && <p className="disclaimer muted small">Not investment advice.</p>}
        </div>
        {!wide && (
          <nav className="tabbar" aria-label="Main">
            {TABS.map((t) => (
              <a key={t.k} href={"#/" + t.k} className={cls(tab.k === t.k && "on")} aria-current={tab.k === t.k ? "page" : undefined}>
                <Icon name={t.k} size={22} /><span>{t.l}</span>
              </a>
            ))}
          </nav>
        )}
      </div>
    </DeskProvider>
  );
}
