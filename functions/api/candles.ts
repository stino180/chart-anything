// Cloudflare Pages Function: GET /api/candles?symbol=AAPL
// Daily OHLC from Yahoo Finance for assets Hyperliquid doesn't cover well
// (stocks, indices, forex, commodities). Yahoo sends no CORS headers, so the
// browser can't call it directly. Responses are cached at the edge.

// App symbol -> Yahoo symbol, for anything that isn't a plain stock ticker
const YAHOO_SYMBOLS: Record<string, string> = {
  // Forex, quoted as USD per 1 unit to match the app's "X in USD" convention
  EUR: 'EURUSD=X',
  GBP: 'GBPUSD=X',
  JPY: 'JPYUSD=X',
  CHF: 'CHFUSD=X',
  CAD: 'CADUSD=X',
  AUD: 'AUDUSD=X',
  // Commodities (front-month futures)
  GOLD: 'GC=F',
  SILVER: 'SI=F',
  OIL: 'CL=F',
  // Indices
  SPX: '^GSPC',
  NDX: '^NDX',
  DJI: '^DJI',
  // Cryptos no longer listed on Hyperliquid under these names
  POL: 'POL28321-USD',
  S: 'S32684-USD',
};

const STOCK_TICKER = /^[A-Z]{1,5}$/;
const EDGE_CACHE_SECONDS = 15 * 60;
const DAY = 86400;

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

export async function onRequestGet(context: {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}): Promise<Response> {
  const { request, waitUntil } = context;
  const symbol = (new URL(request.url).searchParams.get('symbol') ?? '').toUpperCase();
  const yahooSymbol = YAHOO_SYMBOLS[symbol] ?? (STOCK_TICKER.test(symbol) ? symbol : null);
  if (!yahooSymbol) {
    return json({ error: `Unsupported symbol: ${symbol}` }, 400, 0);
  }

  // Normalize the cache key so ?symbol=aapl and ?symbol=AAPL share an entry
  const cacheKey = new Request(`${new URL(request.url).origin}/api/candles?symbol=${symbol}`);
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=5y&interval=1d`,
    { headers: { 'user-agent': 'Mozilla/5.0 (compatible; DuoChart/1.0)' } },
  );
  if (!upstream.ok) {
    return json({ error: `Price source returned ${upstream.status} for ${symbol}` }, 502, 0);
  }

  const payload = await upstream.json() as {
    chart?: { result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<Record<'open' | 'high' | 'low' | 'close' | 'volume', (number | null)[]>> };
    }> };
  };
  const result = payload.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const timestamps = result?.timestamp ?? [];
  if (!quote || timestamps.length === 0) {
    return json({ error: `No price data for ${symbol}` }, 502, 0);
  }

  // Keyed by day: Yahoo can append today's live bar alongside a same-day bar
  const byDay = new Map<number, Candle>();
  timestamps.forEach((ts, i) => {
    const open = quote.open[i];
    const high = quote.high[i];
    const low = quote.low[i];
    const close = quote.close[i];
    // Yahoo leaves nulls on holidays and halted days
    if (open == null || high == null || low == null || close == null) return;
    // Bucket to the UTC day so candles line up with Hyperliquid's
    const time = Math.floor(ts / DAY) * DAY;
    byDay.set(time, { time, open, high, low, close, volume: quote.volume[i] ?? 0 });
  });

  const candles = [...byDay.values()].sort((a, b) => a.time - b.time);
  const response = json(candles, 200, EDGE_CACHE_SECONDS);
  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
