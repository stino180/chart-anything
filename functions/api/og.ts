// Cloudflare Pages Function: GET /api/og?pair=BTC-XRP
// 1200x630 PNG link-preview card for a pair: name, current ratio, 1Y change and
// a line chart. Linked from the og:image tag that functions/[pair].ts injects.
import { ImageResponse, loadGoogleFont } from 'workers-og';
import { getAssetBySymbol } from '../../src/data/assets';
import {
  type Candle,
  HYPERLIQUID_CRYPTO,
  fetchHyperliquidCandles,
  fetchYahooCandles,
  toYahooSymbol,
  usdCandles,
} from '../../src/lib/priceSources';

const WIDTH = 1200;
const HEIGHT = 630;
const CHART_WIDTH = 1080;
const CHART_HEIGHT = 300;
const CACHE_SECONDS = 6 * 60 * 60;

interface Context {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}

async function getCandles(symbol: string): Promise<Candle[]> {
  if (symbol === 'USD') return usdCandles(365);
  if (HYPERLIQUID_CRYPTO.has(symbol)) return fetchHyperliquidCandles(symbol);
  const yahooSymbol = toYahooSymbol(symbol);
  if (!yahooSymbol) throw new Error(`Unsupported symbol: ${symbol}`);
  return fetchYahooCandles(yahooSymbol);
}

// Daily base/quote closes over the last year, on days both assets traded
async function getRatioSeries(base: string, quote: string): Promise<number[]> {
  const [baseCandles, quoteCandles] = await Promise.all([getCandles(base), getCandles(quote)]);
  const cutoff = Date.now() / 1000 - 365 * 86400;
  const quoteByTime = new Map(quoteCandles.map((c) => [c.time, c.close]));
  const ratios: number[] = [];
  for (const candle of baseCandles) {
    const quoteClose = quoteByTime.get(candle.time);
    if (candle.time >= cutoff && quoteClose) ratios.push(candle.close / quoteClose);
  }
  if (ratios.length < 2) throw new Error(`Not enough overlapping data for ${base}/${quote}`);
  return ratios;
}

function formatRatio(value: number): string {
  if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (value >= 1) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return value.toPrecision(4);
}

function chartSvg(values: number[], color: string): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - ((v - min) / span) * (CHART_HEIGHT - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CHART_WIDTH}" height="${CHART_HEIGHT}" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}">`
    + `<polygon points="0,${CHART_HEIGHT} ${points} ${CHART_WIDTH},${CHART_HEIGHT}" fill="${color}" fill-opacity="0.12"/>`
    + `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>`
    + '</svg>';
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

async function renderCard(base: string, quote: string): Promise<Response> {
  const ratios = await getRatioSeries(base, quote);
  const first = ratios[0];
  const last = ratios[ratios.length - 1];
  const changePct = ((last - first) / first) * 100;
  const up = changePct >= 0;
  const color = up ? '#22c55e' : '#ef4444';

  const html = `
    <div style="display:flex;flex-direction:column;width:${WIDTH}px;height:${HEIGHT}px;padding:56px 60px 40px;background:#0b0d10;color:#f5f5f5;font-family:Outfit;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="display:flex;flex-direction:column;">
          <div style="font-size:72px;font-weight:700;letter-spacing:-1px;">${base} / ${quote}</div>
          <div style="font-size:30px;color:#9ca3af;margin-top:4px;">1 ${base} = ${formatRatio(last)} ${quote}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;">
          <div style="font-size:52px;font-weight:700;color:${color};">${up ? '+' : ''}${changePct.toFixed(1)}%</div>
          <div style="font-size:26px;color:#9ca3af;">past year</div>
        </div>
      </div>
      <img src="${chartSvg(ratios, color)}" width="${CHART_WIDTH}" height="${CHART_HEIGHT}" style="margin-top:auto;" />
      <div style="display:flex;justify-content:space-between;margin-top:20px;font-size:26px;color:#9ca3af;">
        <div style="display:flex;">DuoChart · chart anything against anything</div>
        <div style="display:flex;">duochart.pages.dev</div>
      </div>
    </div>`;

  const font = await loadGoogleFont({ family: 'Outfit', weight: 700 });
  const image = new ImageResponse(html, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: 'Outfit', data: font, weight: 700, style: 'normal' }],
  });
  // Re-wrap so our cache header wins over the library's default
  return new Response(image.body, {
    headers: { 'content-type': 'image/png', 'cache-control': `public, max-age=${CACHE_SECONDS}` },
  });
}

export async function onRequestGet({ request, waitUntil }: Context): Promise<Response> {
  const url = new URL(request.url);
  const [baseSymbol = '', quoteSymbol = ''] = (url.searchParams.get('pair') ?? '').toUpperCase().split('-');
  const base = getAssetBySymbol(baseSymbol);
  const quote = getAssetBySymbol(quoteSymbol);
  const fallback = Response.redirect(`${url.origin}/og-base.png`, 302);
  if (!base || !quote) return fallback;

  // One render per pair per cache window; crawlers hit this repeatedly
  const cacheKey = new Request(`${url.origin}/api/og?pair=${base.symbol}-${quote.symbol}`);
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const response = await renderCard(base.symbol, quote.symbol);
    waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    console.error('OG render failed', base.symbol, quote.symbol, error);
    return fallback;
  }
}
