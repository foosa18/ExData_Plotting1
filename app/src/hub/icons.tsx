import { Icon } from "../ui/kit";

const PATHS: Record<string, string> = {
  home: "M4 11l8-7 8 7M6 9.5V20h4.5v-5h3v5H18V9.5",
  budget: "M3 7h15a3 3 0 0 1 3 3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 7l12-3v3M16 13.5h.01",
  invest: "M4 19h16M5 15l4-4 3 3 7-7M15 7h4v4",
  forecast: "M4 19h16M5 16l4-5 3 2 3-4M15 9l4-3M15 9l4 2",
  more: "M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z",
};
const ALIAS: Record<string, string> = { today: "today", portfolio: "portfolio", options: "options", plan: "plan" };

/** Hub navigation icons; the alpha tools keep their original icons. */
export function HubIcon({ name, size = 20 }: { name: string; size?: number }) {
  if (ALIAS[name]) return <Icon name={ALIAS[name]} size={size} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] || ""} />
    </svg>
  );
}
