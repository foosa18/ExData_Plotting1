import { test } from "node:test";
import assert from "node:assert/strict";
import { holdingReturn, mirrorFromHoldings, portfolioXirr, project, totalBal, verdicts, xirrSolve } from "./desk.ts";
import { PROFILE } from "../data/holdings.sample.ts";

test("XIRR of a single 10% year is 10%", () => {
  assert.ok(Math.abs(xirrSolve([{ t: 0, amt: -100 }, { t: 1, amt: 110 }]) - 0.1) < 1e-9);
});

test("funds younger than the period are excluded", () => {
  assert.equal(holdingReturn("DRAM", 6, "3y"), null); // launched 2026
  assert.equal(holdingReturn("DRAM", 6, "ytd"), null);
});

test("holding return compounds the annual figure over months held", () => {
  const r = holdingReturn("VOO", 24, "3y")!;
  assert.ok(Math.abs(r.cum - (Math.pow(1.2306, 2) - 1) * 100) < 1e-9);
  assert.equal(r.yrs, 2);
});

test("sample portfolio produces totals, XIRR, projection and flags", () => {
  const h = PROFILE.holdings, a = PROFILE.accounts;
  assert.equal(totalBal(h, a), 96000);
  const x = portfolioXirr(h, a, "3y");
  assert.ok(x.xirr !== null && x.used > 0);
  const sim = mirrorFromHoldings(h, a);
  const p = project(h, sim, a, 25, 1)!;
  assert.equal(p.median.length, 26);
  assert.ok(p.lo < p.fv && p.fv < p.hi);
  assert.ok(verdicts(p).length >= 1);
});
