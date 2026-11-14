// Budget, cash-flow and net-worth maths for the finance hub. Pure functions, shared by web and the apps.
export type Cat =
  | "Housing" | "Groceries" | "Dining" | "Transport" | "Utilities" | "Shopping"
  | "Health" | "Kids" | "Entertainment" | "Travel" | "Subscriptions" | "Income" | "Transfer";

export interface CashAccount { k: string; n: string; kind: "checking" | "savings" | "credit" | "loan"; bal: number; inst: string }
/** amt < 0 is money out, amt > 0 is money in. d is YYYY-MM-DD. */
export interface Txn { d: string; payee: string; cat: Cat; amt: number; acct: string }
export interface Budget { cat: Cat; limit: number }
export interface Bill { n: string; cat: Cat; amt: number; day: number; acct: string }
export interface Goal { n: string; target: number; saved: number; mo: number; by: string }
export interface MoneyProfile { label: string; income: number; accounts: CashAccount[]; budgets: Budget[]; bills: Bill[]; goals: Goal[]; txns: Txn[] }

export const ymd = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
export const monthOf = (d: string | Date) => (typeof d === "string" ? d : ymd(d)).slice(0, 7);
export const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

/** Spending (positive dollars) by category for one YYYY-MM month. Income and transfers are excluded. */
export function spendByCat(txns: Txn[], month: string): Partial<Record<Cat, number>> {
  const out: Partial<Record<Cat, number>> = {};
  for (const t of txns) {
    if (monthOf(t.d) !== month || t.amt >= 0 || t.cat === "Transfer" || t.cat === "Income") continue;
    out[t.cat] = (out[t.cat] || 0) - t.amt;
  }
  return out;
}

export type Tone = "ok" | "warn" | "bad";
export interface BudgetRow { cat: Cat; limit: number; spent: number; left: number; pct: number; expected: number; tone: Tone; note: string }

/** Fixed bills per category: what has fallen due by today and the month's total. */
export function billsByCat(bills: Bill[], today: Date): Partial<Record<Cat, { due: number; total: number }>> {
  const out: Partial<Record<Cat, { due: number; total: number }>> = {}, dim = daysInMonth(today);
  for (const b of bills) {
    const x = (out[b.cat] = out[b.cat] || { due: 0, total: 0 });
    x.total += b.amt;
    if (Math.min(b.day, dim) <= today.getDate()) x.due += b.amt;
  }
  return out;
}

/**
 * Each category against its limit, with pacing. "Expected by today" counts fixed bills already due in full,
 * plus the rest of the limit spread evenly over the month, so rent on the 1st does not read as overspending.
 * A category is ahead of pace when it is more than 10% (and $10) above that line.
 */
export function budgetRows(budgets: Budget[], spend: Partial<Record<Cat, number>>, monthFrac: number, fixed: Partial<Record<Cat, { due: number; total: number }>> = {}): BudgetRow[] {
  return budgets.map(({ cat, limit }) => {
    const spent = spend[cat] || 0, left = limit - spent, pct = limit ? spent / limit : 0;
    const f = fixed[cat] || { due: 0, total: 0 };
    const expected = Math.min(limit, f.due + Math.max(0, limit - f.total) * monthFrac);
    const tone: Tone = spent > limit + 0.5 ? "bad" : spent > expected * 1.1 + 10 ? "warn" : "ok";
    const note = tone === "bad" ? "Over by $" + Math.round(-left).toLocaleString("en-US") : tone === "warn" ? "$" + Math.round(spent - expected).toLocaleString("en-US") + " ahead of pace" : "On track";
    return { cat, limit, spent, left, pct, expected, tone, note };
  }).sort((a, b) => (b.spent - b.expected) / (b.limit || 1) - (a.spent - a.expected) / (a.limit || 1));
}

export interface UpcomingBill extends Bill { date: Date; inDays: number }
/** Bills due in the next `days` days, soonest first. A day past the end of a short month falls on its last day. */
export function upcoming(bills: Bill[], today: Date, days: number): UpcomingBill[] {
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const out: UpcomingBill[] = [];
  for (const b of bills) {
    for (let m = 0; m < 2; m++) {
      const first = new Date(t0.getFullYear(), t0.getMonth() + m, 1);
      const date = new Date(first.getFullYear(), first.getMonth(), Math.min(b.day, daysInMonth(first)));
      const inDays = Math.round((date.getTime() - t0.getTime()) / 864e5);
      if (inDays >= 0 && inDays <= days) { out.push({ ...b, date, inDays }); break; }
    }
  }
  return out.sort((a, b) => a.inDays - b.inDays);
}

export interface MonthSummary { month: string; frac: number; income: number; spent: number; budgeted: number; billsLeft: number; goalsMo: number; safeToSpend: number; perDay: number; daysLeft: number }
/**
 * "Safe to spend" for the rest of the month: expected take-home pay, less what is already spent,
 * less bills still to come this month, less planned goal contributions. Spread over the days left.
 */
export function monthSummary(p: MoneyProfile, today: Date): MonthSummary {
  const month = monthOf(today), dim = daysInMonth(today), day = today.getDate();
  const inMonth = p.txns.filter((t) => monthOf(t.d) === month);
  const income = inMonth.filter((t) => t.cat === "Income").reduce((s, t) => s + t.amt, 0);
  const spent = Object.values(spendByCat(p.txns, month)).reduce((s, v) => s + (v || 0), 0);
  const billsLeft = p.bills.filter((b) => Math.min(b.day, dim) > day).reduce((s, b) => s + b.amt, 0);
  const goalsMo = p.goals.reduce((s, g) => s + g.mo, 0);
  const budgeted = p.budgets.reduce((s, b) => s + b.limit, 0);
  const safeToSpend = Math.max(0, Math.max(income, p.income) - spent - billsLeft - goalsMo);
  const daysLeft = dim - day + 1;
  return { month, frac: day / dim, income, spent, budgeted, billsLeft, goalsMo, safeToSpend, perDay: safeToSpend / daysLeft, daysLeft };
}

export interface FlowMonth { month: string; income: number; spent: number; net: number }
/** Income, spending and net for the last `n` months, oldest first, ending with the current month. */
export function cashFlow(txns: Txn[], today: Date, n: number): FlowMonth[] {
  const out: FlowMonth[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const month = monthOf(new Date(today.getFullYear(), today.getMonth() - i, 1));
    const income = txns.filter((t) => monthOf(t.d) === month && t.cat === "Income").reduce((s, t) => s + t.amt, 0);
    const spent = Object.values(spendByCat(txns, month)).reduce((s, v) => s + (v || 0), 0);
    out.push({ month, income, spent, net: income - spent });
  }
  return out;
}

/** Cash accounts net of card and loan balances. */
export const cashNet = (accounts: CashAccount[]) => accounts.reduce((s, a) => s + (a.kind === "credit" || a.kind === "loan" ? -a.bal : a.bal), 0);

/** Months until a goal is reached at its monthly contribution (Infinity when nothing is going in). */
export const goalMonths = (g: Goal) => (g.saved >= g.target ? 0 : g.mo > 0 ? Math.ceil((g.target - g.saved) / g.mo) : Infinity);
