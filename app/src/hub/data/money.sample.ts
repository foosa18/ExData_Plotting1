import type { Bill, Cat, MoneyProfile, Txn } from "../core/money.ts";
import { daysInMonth, ymd } from "../core/money.ts";

// Sample household finances so the hub has something real-looking to show before bank data is connected (mini project 2).
// Generated relative to today with a fixed seed, so it is stable within a day and always current.

function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const BILLS: Bill[] = [
  { n: "Mortgage", cat: "Housing", amt: 2450, day: 1, acct: "chk" },
  { n: "Daycare", cat: "Kids", amt: 1350, day: 5, acct: "chk" },
  { n: "Car payment", cat: "Transport", amt: 420, day: 12, acct: "chk" },
  { n: "Electric", cat: "Utilities", amt: 140, day: 18, acct: "card" },
  { n: "Internet", cat: "Utilities", amt: 75, day: 21, acct: "card" },
  { n: "Phone", cat: "Utilities", amt: 95, day: 24, acct: "card" },
  { n: "Streaming bundle", cat: "Subscriptions", amt: 38, day: 9, acct: "card" },
  { n: "Gym", cat: "Health", amt: 60, day: 15, acct: "card" },
  { n: "Cloud storage", cat: "Subscriptions", amt: 10, day: 27, acct: "card" },
];

// [category, payees, typical amount, visits per month]
const VARIABLE: [Cat, string[], number, number][] = [
  ["Groceries", ["Trader Joe's", "Costco", "Whole Foods", "Local market"], 95, 9],
  ["Dining", ["Chipotle", "Neighborhood cafe", "Thai Basil", "Pizza night"], 38, 8],
  ["Transport", ["Shell", "Chevron", "Parking", "Rideshare"], 45, 5],
  ["Shopping", ["Amazon", "Target", "Home Depot"], 70, 5],
  ["Health", ["Pharmacy", "Dental copay"], 40, 1],
  ["Entertainment", ["Movie tickets", "Concert", "Bookstore"], 45, 2],
  ["Travel", ["Airline", "Hotel"], 260, 0.4],
  ["Kids", ["Toy store", "Swim lessons"], 55, 2],
];

export function sampleMoney(today: Date): MoneyProfile {
  const r = rng(Number(ymd(today).replace(/-/g, "")) % 9973);
  const txns: Txn[] = [];
  for (let m = 5; m >= 0; m--) {
    const first = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const dim = daysInMonth(first);
    const last = m === 0 ? today.getDate() : dim;
    const d = (day: number) => ymd(new Date(first.getFullYear(), first.getMonth(), Math.min(day, dim)));
    for (const pay of [1, 15]) if (pay <= last) txns.push({ d: d(pay), payee: "Payroll", cat: "Income", amt: 4600, acct: "chk" });
    for (const b of BILLS) if (b.day <= last) txns.push({ d: d(b.day), payee: b.n, cat: b.cat, amt: -b.amt, acct: b.acct });
    if (15 <= last) txns.push({ d: d(15), payee: "To high-yield savings", cat: "Transfer", amt: -800, acct: "chk" });
    for (const [cat, payees, typ, per] of VARIABLE) {
      const n = Math.round(per * (last / dim) * (0.7 + r() * 0.6));
      for (let i = 0; i < n; i++) {
        txns.push({ d: d(1 + Math.floor(r() * last)), payee: payees[Math.floor(r() * payees.length)], cat, amt: -Math.round(typ * (0.4 + r() * 1.3) * 100) / 100, acct: r() < 0.8 ? "card" : "chk" });
      }
    }
  }
  txns.sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0));
  return {
    label: "Sample household",
    income: 9200,
    accounts: [
      { k: "chk", n: "Everyday checking", kind: "checking", bal: 6840, inst: "Bank" },
      { k: "hys", n: "High-yield savings", kind: "savings", bal: 24500, inst: "Online bank" },
      { k: "card", n: "Rewards card", kind: "credit", bal: 2310, inst: "Card issuer" },
      { k: "auto", n: "Auto loan", kind: "loan", bal: 14800, inst: "Lender" },
    ],
    budgets: [
      { cat: "Housing", limit: 2450 }, { cat: "Kids", limit: 1500 }, { cat: "Groceries", limit: 900 },
      { cat: "Dining", limit: 350 }, { cat: "Transport", limit: 650 }, { cat: "Utilities", limit: 320 },
      { cat: "Shopping", limit: 400 }, { cat: "Health", limit: 150 }, { cat: "Entertainment", limit: 120 },
      { cat: "Subscriptions", limit: 60 }, { cat: "Travel", limit: 200 },
    ],
    bills: BILLS,
    goals: [
      { n: "Emergency fund (6 months)", target: 36000, saved: 24500, mo: 800, by: "2027-12" },
      { n: "Max Roth IRA", target: 7000, saved: 4500, mo: 500, by: "2027-04" },
      { n: "Family trip", target: 6000, saved: 1800, mo: 300, by: "2027-08" },
    ],
    txns,
  };
}
