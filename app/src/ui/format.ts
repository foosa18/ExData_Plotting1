export const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export const fmtK = (n: number) => (n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M" : "$" + Math.round(n / 1e3) + "k");
export const pct = (n: number, d = 1) => (n >= 0 ? "" : "-") + Math.abs(n).toFixed(d) + "%";
export const signed = (n: number, d = 1) => (n >= 0 ? "+" : "") + n.toFixed(d) + "%";
export const num = (x: number, n: number) => Number(x).toLocaleString("en-US", { minimumFractionDigits: n, maximumFractionDigits: n });
export const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");
