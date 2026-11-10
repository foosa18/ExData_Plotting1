import type { Profile } from "./types";
import { PROFILE as SAMPLE } from "./holdings.sample";

// Use the private, git-ignored holdings.local.ts when it exists; otherwise the sample.
const local = import.meta.glob<{ PROFILE: Profile }>("./holdings.local.ts", { eager: true });
const found = Object.values(local)[0];
export const PROFILE: Profile = found ? found.PROFILE : SAMPLE;
