import { test } from "node:test";
import assert from "node:assert/strict";
import { billsByCat, budgetRows, cashFlow, cashNet, goalMonths, monthSummary, spendByCat, upcoming, type MoneyProfile } from "./money.ts";

const P: MoneyProfile = {
  label: "t", income: 5000,
  accounts: [{ k: "c", n: "C", kind: "checking", bal: 1000, inst: "" }, { k: "x", n: "X", kind: "credit", bal: 300, inst: "" }],
  budgets: [{ cat: "Dining", limit: 200 }, { cat: "Groceries", limit: 600 }],
  bills: [{ n: "Rent", cat: "Housing", amt: 2000, day: 1, acct: "c" }, { n: "Phone", cat: "Utilities", amt: 80, day: 31, acct: "c" }],
  goals: [{ n: "G", target: 1000, saved: 400, mo: 100, by: "" }],
  txns: [
    { d: "2026-11-01", payee: "Pay", cat: "Income", amt: 5000, acct: "c" },
    { d: "2026-11-01", payee: "Rent", cat: "Housing", amt: -2000, acct: "c" },
    { d: "2026-11-03", payee: "Cafe", cat: "Dining", amt: -150, acct: "x" },
    { d: "2026-11-04", payee: "Shop", cat: "Groceries", amt: -100, acct: "x" },
    { d: "2026-11-05", payee: "Save", cat: "Transfer", amt: -500, acct: "c" },
    { d: "2026-10-20", payee: "Cafe", cat: "Dining", amt: -40, acct: "x" },
  ],
};
const today = new Date(2026, 10, 10); // 10 Nov 2026, November has 30 days

test("spending by category ignores income, transfers and other months", () => {
  assert.deepEqual(spendByCat(P.txns, "2026-11"), { Housing: 2000, Dining: 150, Groceries: 100 });
});

test("budget pacing flags a category ahead of pace", () => {
  const rows = budgetRows(P.budgets, spendByCat(P.txns, "2026-11"), 10 / 30);
  assert.equal(rows[0].cat, "Dining");
  assert.equal(rows[0].tone, "warn"); // 75% spent a third of the way through
  assert.equal(rows[1].tone, "ok");
});

test("bills already due count in full toward the pace line", () => {
  const fixed = billsByCat(P.bills, today);
  assert.deepEqual(fixed.Housing, { due: 2000, total: 2000 });
  const [row] = budgetRows([{ cat: "Housing", limit: 2000 }], spendByCat(P.txns, "2026-11"), 10 / 30, fixed);
  assert.equal(row.expected, 2000);
  assert.equal(row.tone, "ok"); // rent paid on the 1st is on plan, not ahead of pace
});

test("bills on day 31 fall on the last day of a 30-day month", () => {
  const u = upcoming(P.bills, today, 30);
  assert.equal(u[0].n, "Phone");
  assert.equal(u[0].date.getDate(), 30);
  assert.equal(u[1].n, "Rent"); // next month's 1st
});

test("safe to spend nets spending, remaining bills and goals", () => {
  const s = monthSummary(P, today);
  assert.equal(s.spent, 2250);
  assert.equal(s.billsLeft, 80);
  assert.equal(s.safeToSpend, 5000 - 2250 - 80 - 100);
  assert.equal(s.daysLeft, 21);
});

test("cash flow, net cash and goal months", () => {
  const f = cashFlow(P.txns, today, 2);
  assert.deepEqual(f.map((m) => m.net), [-40, 2750]);
  assert.equal(cashNet(P.accounts), 700);
  assert.equal(goalMonths(P.goals[0]), 6);
});
