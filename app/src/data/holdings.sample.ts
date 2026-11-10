import type { Profile } from "./types";

// Sample portfolio used when src/data/holdings.local.ts is absent (it is git-ignored).
// Copy this file to holdings.local.ts and put your own accounts and positions in it.
export const PROFILE: Profile = {
  label: "Sample portfolio",
  accounts: [
    { k: "401k", n: "401(k)", mo: 1500, tax: "Tax-deferred" },
    { k: "brok", n: "Brokerage", mo: 500, tax: "Taxable" },
    { k: "roll", n: "Rollover IRA", mo: 0, tax: "Tax-deferred" },
    { k: "roth", n: "Roth IRA", mo: 500, tax: "Tax-free" },
    { k: "utma", n: "UTMA", mo: 100, tax: "Taxable (minor)" },
    { k: "529", n: "529", mo: 100, tax: "Tax-free (education)" },
  ],
  holdings: {
    "401k": [["FXAIX", 30000, 60], ["FTIHX", 15000, 60], ["FXNAX", 6000, 60]],
    brok: [["VOO", 10000, 36], ["SCHD", 5000, 24], ["VXUS", 4000, 24]],
    roll: [["AOA", 6000, 48], ["BND", 3000, 48], ["IAU", 2000, 36]],
    roth: [["VUG", 4000, 36], ["SMH", 2000, 24], ["AVUV", 2000, 24]],
    utma: [["VTI", 3000, 24]],
    "529": [["VASGX", 4000, 24]],
  },
  recommended: {
    "401k": [["FSKAX", 50], ["FTIHX", 22], ["FSSNX", 18], ["FXNAX", 10]],
    brok: [["ITOT", 40], ["VXUS", 20], ["SCHD", 20], ["VIG", 10], ["COWZ", 10]],
    roll: [["AVUV", 25], ["AVDV", 20], ["VUG", 20], ["VNQ", 20], ["IAUM", 15]],
    roth: [["VUG", 30], ["SMH", 35], ["AVUV", 20], ["AVDV", 15]],
    utma: [["VTI", 70], ["VXUS", 30]],
    "529": [["VASGX", 100]],
  },
  notes: [
    ["Emergency reserve", "Three to six months of expenses in T-bills precedes any of this."],
    ["Pro-rata exposure", "Pre-tax IRA balances make most of a backdoor Roth conversion taxable."],
    ["Dividend reinvestment", "Cash left in a money market earns nothing and silently drags returns."],
  ],
  bondBand: "Below the 10–15% band for a long horizon.",
};
