// Feature flags keep in-progress mini projects out of the alpha. Everything is off unless switched on.
// Switch on with ?hub=1 (remembered on this device), off again with ?hub=0, or from the hub's own toggle.
const KEY = "investing.flags";
export type FlagName = "hub";

function read(): Partial<Record<FlagName, boolean>> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
export function setFlag(name: FlagName, on: boolean) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), [name]: on })); } catch { /* storage unavailable */ }
}
export function flagOn(name: FlagName): boolean {
  const q = new URLSearchParams(location.search).get(name);
  if (q === "1" || q === "0") { setFlag(name, q === "1"); return q === "1"; }
  return !!read()[name];
}
