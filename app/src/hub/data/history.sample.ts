// Sample daily net-worth history: a drifting random walk with one drawdown, ending exactly at today's value.
// Replaced by real balance snapshots once accounts are connected (mini projects 2 and 3).
export interface Point { t: Date; v: number }
export function sampleHistory(end: number, today: Date, days = 730): Point[] {
  let seed = 7;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const vals = new Array<number>(days + 1);
  vals[days] = end;
  for (let i = days; i > 0; i--) {
    const step = 0.00035 + (r() - 0.5) * 0.014 + (i > 420 && i < 470 ? -0.004 : 0);
    vals[i - 1] = vals[i] / (1 + step);
  }
  return vals.map((v, i) => ({ t: new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - i)), v }));
}
