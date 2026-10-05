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

## Data
- Prices from Financial Modeling Prep (`src/lib/chartData.ts`), key in `VITE_FMP_API_KEY`
- On fetch failure it silently falls back to generated mock OHLC data — a "working" chart is not proof the API works
- `VITE_*` vars are baked into the client bundle, so the FMP key is public; don't put secrets in `VITE_*`
- `src/integrations/supabase/` is Lovable-generated and currently unused

## Static assets
- `public/` holds favicon, OG image, app icon, and `manifest.webmanifest`
- `public/sw.js` is a kill switch that unregisters the old cache-first service worker (it served stale `index.html` after deploys → blank screen). Not registered by the app. If adding a real one, use network-first for navigations.
