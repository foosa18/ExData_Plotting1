import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { StatusBar, Style } from "@capacitor/status-bar";

// One place for the few things that differ between the hosted web app and the iOS/Android shells.
export const isNative = Capacitor.isNativePlatform();
const forced = new URLSearchParams(location.search).get("platform"); // preview override: ?platform=ios|android
export const platform: string = forced || Capacitor.getPlatform(); // "web" | "ios" | "android"

const KEY = "investing.v1.";
export async function loadState<T>(k: string): Promise<T | null> {
  try {
    if (isNative) { const { value } = await Preferences.get({ key: KEY + k }); return value ? JSON.parse(value) : null; }
    const v = localStorage.getItem(KEY + k);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
let timer: ReturnType<typeof setTimeout> | undefined;
export function saveState(k: string, v: unknown) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      const s = JSON.stringify(v);
      if (isNative) Preferences.set({ key: KEY + k, value: s });
      else localStorage.setItem(KEY + k, s);
    } catch { /* storage unavailable: state stays in memory */ }
  }, 250);
}

export function syncStatusBar(dark: boolean) {
  if (!isNative) return;
  StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
  if (platform === "android") StatusBar.setBackgroundColor({ color: dark ? "#101312" : "#f4f5f3" }).catch(() => {});
}
