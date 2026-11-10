# Investing Platform app (web, iOS, Android)

One React + TypeScript codebase that ships three ways:

| Target | How it is built | Where it runs |
|---|---|---|
| Web dashboard | `npm run build` → `dist/` | Any static host (GitHub Pages workflow included) |
| Android app | Capacitor wraps the same `dist/` | `android/` project, open in Android Studio |
| iOS app | Capacitor wraps the same `dist/` | `ios/` project, open in Xcode (needs a Mac) |

## Parity rule

Every screen, number and piece of logic lives once in `src/`. A change there lands on web, iOS and Android
together, so the versions cannot drift. The only places the platforms differ:

- **Layout**: at 900px and wider the app shows a sidebar and multi-column grids (web/tablet); narrower it shows
  the phone layout with a bottom tab bar and bottom sheets. Both come from the same components (`src/ui/hooks.ts`, `WIDE`).
- **Device services**: `src/platform.ts` (storage via Capacitor Preferences on devices, status bar colour).

Add `?platform=ios` or `?platform=android` to the web URL to preview the small platform-specific touches.

## Layout

```
src/core/      Shared maths and content: desk.ts (Portfolio Allocation Desk), screener.ts (Options Screener v2), plan.ts, funds.ts
src/data/      Portfolio profile. holdings.local.ts (git-ignored) holds your real accounts; holdings.sample.ts is the fallback
src/screens/   Today, Portfolio, Options, Plan
src/ui/        Design system components (tokens in styles.css come from the Desk, Exhibit 9)
```

The ported maths matches the original platform exactly; `npm test` checks the screener ranking and the Desk calculations.

## Commands

```bash
npm install
npm run dev            # web, hot reload
npm test               # logic tests
npm run build          # web build into dist/
npm run cap:android    # build, sync and open Android Studio
npm run cap:ios        # build, sync and open Xcode (macOS)
```

## Your holdings

Copy `src/data/holdings.sample.ts` to `src/data/holdings.local.ts` and edit it. That file is git-ignored, so personal
balances never reach this public repository. Builds made on your machine include it; CI and GitHub Pages builds use the sample.

## Publishing to the stores

- **Google Play**: a Google Play Console developer account (one-time fee). Build a signed release bundle in Android Studio.
- **Apple App Store**: an Apple Developer Program membership (annual fee) and a Mac with Xcode for signing and upload.
- Set a permanent `appId` in `capacitor.config.ts` before the first store upload; it cannot change afterwards.
- Both stores ask for a privacy policy URL, and finance apps get extra review scrutiny, so the "not investment advice" wording stays visible.
