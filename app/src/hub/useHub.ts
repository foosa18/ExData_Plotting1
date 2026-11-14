import { useMemo } from "react";
import { PROFILE } from "../data/profile";
import { totalBal } from "../core/desk";
import { useDesk } from "../store";
import { cashNet } from "./core/money";
import { sampleMoney } from "./data/money.sample";
import { sampleHistory, type Point } from "./data/history.sample";

export type Range = "1w" | "1m" | "3m" | "1y" | "all";
export const RANGES: { v: Range; l: string; days: number }[] = [
  { v: "1w", l: "1W", days: 7 }, { v: "1m", l: "1M", days: 30 }, { v: "3m", l: "3M", days: 91 }, { v: "1y", l: "1Y", days: 365 }, { v: "all", l: "All", days: 100000 },
];
export const slice = (pts: Point[], r: Range) => pts.slice(-Math.min(pts.length, (RANGES.find((x) => x.v === r)?.days || 30) + 1));

/** Everything the hub screens share: sample money data, live desk holdings, and the derived totals. */
export function useHub() {
  const { s } = useDesk();
  const today = useMemo(() => new Date(), []);
  const money = useMemo(() => sampleMoney(today), [today]);
  const invest = totalBal(s.holdings, PROFILE.accounts);
  const cash = cashNet(money.accounts);
  const netWorth = invest + cash;
  const nwHistory = useMemo(() => sampleHistory(netWorth, today), [netWorth, today]);
  const invHistory = useMemo(() => sampleHistory(invest, today), [invest, today]);
  return { today, money, invest, cash, netWorth, nwHistory, invHistory, desk: s };
}
