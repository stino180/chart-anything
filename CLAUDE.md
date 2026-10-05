# DuoChart (chart-anything) — Developer Notes

Synthetic-pair candlestick charts: pick any two assets (BTC/XRP, AAPL/GOLD, ...) and chart one priced in the other.

## Stack
- React 18 + Vite + TypeScript, Tailwind + shadcn/ui (`src/components/ui`)
- Charts: `lightweight-charts` (`src/components/chart/`)
- Built with Lovable — Lovable may push commits directly to `main`

## Deploy
- Cloudflare Pages, auto-deploys from `main` — pushing to `main` ships to production
- Build from the repo root: `npm run build` → `dist/` (Pages project `duochart`; it used to build an old `webapp/` copy, which is why Lovable edits weren't going live)
- After Lovable changes: run `npm install --package-lock-only` and commit `package-lock.json`, or `npm ci` fails on the out-of-sync lockfile

## Data (no API keys needed)
- `src/lib/chartData.ts` picks the source per symbol:
  - Crypto in `HYPERLIQUID_CRYPTO` → Hyperliquid `candleSnapshot` (api.hyperliquid.xyz/info), called from the browser
  - Everything else → `/api/candles?symbol=X` → `functions/api/candles.ts`, a Cloudflare Pages Function proxying Yahoo Finance (no CORS on Yahoo). Non-ticker symbols (forex, GOLD, SPX, POL...) need an entry in its `YAHOO_SYMBOLS` map
- Both sources bucket candles to UTC midnight; synthetic pairs join on exact `time`, so a mismatch silently empties cross-source pairs
- On failure the UI shows an error. Never reintroduce mock/fallback prices — the site shipped fake charts for months that way (FMP with no key)
- `/api/*` only exists on Cloudflare (or `npx wrangler pages dev dist`); under `vite` dev and Lovable's preview, non-crypto assets show the load error
- Mobile app (Capacitor): the webview has no `/api`, so `chartData.ts` calls `https://duochart.pages.dev/api/...` when `window.Capacitor` is native, and the function allows CORS only from Capacitor origins (`APP_ORIGINS`). Keep both in sync if the domain changes
- Don't put secrets in `VITE_*` vars — they're baked into the public bundle
- `src/integrations/supabase/` is Lovable-generated and currently unused

## Static assets
- `public/` holds favicon, OG image, app icon, and `manifest.webmanifest`
- `public/sw.js` is a kill switch that unregisters the old cache-first service worker (it served stale `index.html` after deploys → blank screen). Not registered by the app. If adding a real one, use network-first for navigations.
