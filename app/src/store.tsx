import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { PROFILE } from "./data/profile";
import type { Holding, Target } from "./data/types";
import { mirrorFromHoldings, type Holdings, type Period, type Targets } from "./core/desk";
import { loadState, saveState } from "./platform";

export interface DeskState {
  holdings: Holdings;
  sim: Targets;
  xirrPeriod: Period;
  holdPeriod: Period;
  horizon: number;
  shock: number;
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
export const initialDesk = (): DeskState => ({
  holdings: clone(PROFILE.holdings),
  sim: mirrorFromHoldings(PROFILE.holdings, PROFILE.accounts),
  xirrPeriod: "3y",
  holdPeriod: "3y",
  horizon: 25,
  shock: 1,
});

export type Action =
  | { type: "hold.set"; acct: string; i: number; row: Holding }
  | { type: "hold.add"; acct: string; ticker: string }
  | { type: "hold.del"; acct: string; i: number }
  | { type: "sim.weight"; acct: string; i: number; w: number }
  | { type: "sim.add"; acct: string; ticker: string }
  | { type: "sim.del"; acct: string; i: number }
  | { type: "reset" }
  | { type: "mirror" }
  | { type: "apply" }
  | { type: "set"; patch: Partial<DeskState> }
  | { type: "load"; state: DeskState };

function reducer(s: DeskState, a: Action): DeskState {
  const h = clone(s.holdings), sim = clone(s.sim);
  switch (a.type) {
    case "hold.set": h[a.acct][a.i] = [a.row[0], Math.max(0, +a.row[1] || 0), Math.max(0, Math.min(600, +a.row[2] || 0))]; return { ...s, holdings: h };
    case "hold.add": (h[a.acct] = h[a.acct] || []).push([a.ticker, 5000, 12]); return { ...s, holdings: h };
    case "hold.del": h[a.acct].splice(a.i, 1); return { ...s, holdings: h };
    case "sim.weight": sim[a.acct][a.i][1] = Math.max(0, Math.min(100, Math.round(+a.w || 0))); return { ...s, sim };
    case "sim.add": (sim[a.acct] = sim[a.acct] || []).push([a.ticker, 5] as Target); return { ...s, sim };
    case "sim.del": sim[a.acct].splice(a.i, 1); return { ...s, sim };
    case "reset": return { ...initialDesk(), xirrPeriod: s.xirrPeriod, holdPeriod: s.holdPeriod, horizon: s.horizon, shock: s.shock };
    case "mirror": return { ...s, sim: mirrorFromHoldings(s.holdings, PROFILE.accounts) };
    case "apply": return { ...s, sim: clone(PROFILE.recommended) };
    case "set": return { ...s, ...a.patch };
    case "load": return a.state;
  }
}

const Ctx = createContext<{ s: DeskState; d: (a: Action) => void } | null>(null);

export function DeskProvider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, undefined, initialDesk);
  useEffect(() => { loadState<DeskState>("desk").then((st) => { if (st && st.holdings && st.sim) d({ type: "load", state: { ...initialDesk(), ...st } }); }); }, []);
  useEffect(() => { saveState("desk", s); }, [s]);
  const v = useMemo(() => ({ s, d }), [s]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useDesk() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDesk outside DeskProvider");
  return c;
}
