// Cloudflare Pages Function: GET /api/candles?symbol=AAPL
// Daily OHLC from Yahoo Finance for assets Hyperliquid doesn't cover well
// (stocks, indices, forex, commodities). Yahoo sends no CORS headers, so the
// browser can't call it directly. Responses are cached at the edge.
import { fetchYahooCandles, toYahooSymbol } from '../../src/lib/priceSources';

const EDGE_CACHE_SECONDS = 15 * 60;

// The Capacitor mobile app's webview runs on these origins, not duochart.pages.dev.
// Only these get CORS access, so other sites can't hotlink this endpoint.
const APP_ORIGINS = new Set(['capacitor://localhost', 'https://localhost', 'http://localhost']);

interface Context {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}

function json(body: unknown, status: number, maxAge: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=${maxAge}`,
    },
  });
}

export async function onRequestGet(context: Context): Promise<Response> {
  const response = await getCandles(context);
  const origin = context.request.headers.get('origin');
  if (!origin || !APP_ORIGINS.has(origin)) return response;
  // Added after the edge cache so a cached entry never carries one app's origin
  const withCors = new Response(response.body, response);
  withCors.headers.set('access-control-allow-origin', origin);
  withCors.headers.set('vary', 'Origin');
  return withCors;
}

async function getCandles(context: Context): Promise<Response> {
  const { request, waitUntil } = context;
  const symbol = (new URL(request.url).searchParams.get('symbol') ?? '').toUpperCase();
  const yahooSymbol = toYahooSymbol(symbol);
  if (!yahooSymbol) {
    return json({ error: `Unsupported symbol: ${symbol}` }, 400, 0);
  }

  // Normalize the cache key so ?symbol=aapl and ?symbol=AAPL share an entry
  const cacheKey = new Request(`${new URL(request.url).origin}/api/candles?symbol=${symbol}`);
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let candles;
  try {
    candles = await fetchYahooCandles(yahooSymbol);
  } catch (error) {
    return json({ error: `Price source failed for ${symbol}: ${(error as Error).message}` }, 502, 0);
  }

  const response = json(candles, 200, EDGE_CACHE_SECONDS);
  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
