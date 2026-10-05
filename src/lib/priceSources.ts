// Price-source rules shared by the browser (chartData.ts) and the Cloudflare
// functions (functions/). Keep this file free of '@/' imports and browser
// globals so both bundlers can use it.

export interface Candle {
  time: number; // Unix seconds, bucketed to UTC midnight
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const DAY = 86400;

// Crypto with live markets on Hyperliquid; everything else goes through Yahoo
export const HYPERLIQUID_CRYPTO = new Set([
  'BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'UNI',
  'ATOM', 'LTC', 'HYPE', 'SUI', 'APT', 'ARB', 'OP', 'INJ',
]);

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

export function toYahooSymbol(symbol: string): string | null {
  return YAHOO_SYMBOLS[symbol] ?? (STOCK_TICKER.test(symbol) ? symbol : null);
}

const toDay = (seconds: number) => Math.floor(seconds / DAY) * DAY;

export async function fetchHyperliquidCandles(symbol: string): Promise<Candle[]> {
  const response = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'candleSnapshot',
      // Hyperliquid caps a response at 5000 candles, ~13 years of dailies
      req: { coin: symbol, interval: '1d', startTime: Date.now() - 5 * 365 * DAY * 1000 },
    }),
  });
  if (!response.ok) {
    throw new Error(`Hyperliquid returned ${response.status} for ${symbol}`);
  }
  const candles: Array<{ t: number; o: string; h: string; l: string; c: string; v: string }> = await response.json();
  if (!Array.isArray(candles) || candles.length === 0) {
    throw new Error(`No price data for ${symbol}`);
  }
  return candles.map((c) => ({
    time: toDay(c.t / 1000),
    open: Number(c.o),
    high: Number(c.h),
    low: Number(c.l),
    close: Number(c.c),
    volume: Number(c.v),
  }));
}

// Server-side only: Yahoo sends no CORS headers, so browsers can't call this
export async function fetchYahooCandles(yahooSymbol: string): Promise<Candle[]> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=5y&interval=1d`,
    { headers: { 'user-agent': 'Mozilla/5.0 (compatible; DuoChart/1.0)' } },
  );
  if (!response.ok) {
    throw new Error(`Yahoo returned ${response.status} for ${yahooSymbol}`);
  }
  const payload = await response.json() as {
    chart?: { result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<Record<'open' | 'high' | 'low' | 'close' | 'volume', (number | null)[]>> };
    }> };
  };
  const result = payload.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const timestamps = result?.timestamp ?? [];
  if (!quote || timestamps.length === 0) {
    throw new Error(`No price data for ${yahooSymbol}`);
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
    const time = toDay(ts);
    byDay.set(time, { time, open, high, low, close, volume: quote.volume[i] ?? 0 });
  });
  return [...byDay.values()].sort((a, b) => a.time - b.time);
}

// USD is the unit everything is priced in, so it's a flat 1 every day
export function usdCandles(days: number): Candle[] {
  const today = toDay(Date.now() / 1000);
  const data: Candle[] = [];
  for (let i = days; i >= 0; i--) {
    data.push({ time: today - i * DAY, open: 1, high: 1, low: 1, close: 1, volume: 0 });
  }
  return data;
}
