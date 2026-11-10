import { test } from "node:test";
import assert from "node:assert/strict";
import { runScreen } from "./screener.ts";

// Ranking produced by the original Options Screener tab on the demo universe; both platforms must match it.
const EXPECTED: [string, number, string][] = [["MSFT",61.5,"BUY PREMIUM"],["XLE",61.3,"BUY PREMIUM"],["GLD",61.3,"BUY PREMIUM"],["QQQ",61.1,"BUY PREMIUM"],["SPY",59.8,"BUY PREMIUM"],["META",59.2,"BUY PREMIUM"],["ARKK",58.3,"BUY PREMIUM"],["AMD",56.7,"BUY PREMIUM"],["COIN",56.1,"NEUTRAL"],["TSLA",55.2,"NEUTRAL"],["IBIT",54.9,"NEUTRAL"],["MSTR",54.5,"NEUTRAL"],["NET",54.3,"BUY PREMIUM"],["VST",53.7,"NEUTRAL"],["PLTR",53.6,"NEUTRAL"],["EL",52.1,"NEUTRAL"]];

test("screener ranks the demo universe exactly like the original", () => {
  const { rows } = runScreen(new Date("2026-11-10T12:00:00Z"));
  assert.deepEqual(rows.map((r) => [r.ticker, r.score, r.verdict]), EXPECTED);
  assert.equal(rows[0].contract, "C 500 @ 2026-12-25");
});
