// Forecast model registry. Each model takes the same inputs and returns a fan (p10 / p50 / p90 paths),
// so models UP builds later (in Python, mini project 4) plug in beside the baseline without new screens.
import { project, type Holdings, type Targets } from "../../core/desk.ts";
import type { Account } from "../../data/types.ts";

export interface ForecastInput { holdings: Holdings; sim: Targets; accounts: Account[]; horizon: number; shock: number }
export interface Forecast { median: number[]; low: number[]; high: number[]; rate: number; note: string }
export type ModelStatus = "live" | "planned";
export interface ForecastModel {
  id: string; name: string; scope: string; cadence: string; status: ModelStatus; summary: string;
  run?: (i: ForecastInput) => Forecast | null;
}

export const MODELS: ForecastModel[] = [
  {
    id: "baseline", name: "Baseline long-run projection", scope: "Whole portfolio", cadence: "Yearly steps", status: "live",
    summary: "Category expected returns net of fees, plus monthly contributions. The range is the median rate −3 / +2.5 points.",
    run: (i) => {
      const p = project(i.holdings, i.sim, i.accounts, i.horizon, i.shock);
      return p && { median: p.median, low: p.low, high: p.high, rate: p.r, note: "Expected " + (p.r * 100).toFixed(1) + "% a year after fees" };
    },
  },
  { id: "eq-mom", name: "Equity momentum", scope: "US equities and ETFs", cadence: "Daily", status: "planned", summary: "Slot for your cross-sectional momentum model: ranks, expected 1–3 month returns and confidence." },
  { id: "cmd-trend", name: "Commodity trend", scope: "Gold, oil, broad commodities", cadence: "Daily", status: "planned", summary: "Slot for a trend and carry model on commodity futures or ETFs." },
  { id: "intraday", name: "Intraday signals", scope: "Liquid equities", cadence: "Minutes", status: "planned", summary: "Slot for higher-frequency signals. Shows live levels and hit rate once a feed is connected." },
  { id: "macro", name: "Macro regime", scope: "Cross-asset", cadence: "Weekly", status: "planned", summary: "Slot for a regime classifier that tilts the baseline's expected returns." },
];

/** What a model publishes for the app to read: one JSON file per model run, written by the Python engine. */
export const MODEL_CONTRACT = `{
  "model": "eq-mom",
  "as_of": "2026-11-14T21:00:00Z",
  "target": "SPY",            // ticker, account key or "portfolio"
  "horizon_days": 63,
  "series": [ { "t": "2026-12-01", "p10": 0.97, "p50": 1.02, "p90": 1.06 } ],
  "signals": [ { "ticker": "SMH", "score": 0.82, "side": "long" } ],
  "backtest": { "cagr": 0.11, "sharpe": 0.9, "max_dd": -0.18, "hit_rate": 0.56 }
}`;
