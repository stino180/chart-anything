import type { CandlestickData, Time } from 'lightweight-charts';
import { DAY, HYPERLIQUID_CRYPTO, fetchHyperliquidCandles, usdCandles } from './priceSources';

export interface OHLCData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Where prices come from (rules live in priceSources.ts, shared with functions/):
// - Crypto: Hyperliquid's public info API, called straight from the browser
// - Everything else: /api/candles (functions/api/candles.ts), which proxies
//   Yahoo Finance since Yahoo doesn't allow browser requests
// Both are bucketed to UTC days so cross-source pairs (e.g. BTC/AAPL) line up.

// Inside the Capacitor mobile app the page isn't served by Cloudflare, so a
// relative /api path has nothing behind it; call the production site instead.
// Capacitor injects window.Capacitor into its webview, no import needed.
const isNativeApp = Boolean(
  (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.(),
);
const API_BASE_URL = isNativeApp ? 'https://duochart.pages.dev' : '';

async function fetchViaCandlesApi(symbol: string): Promise<OHLCData[]> {
  const response = await fetch(`${API_BASE_URL}/api/candles?symbol=${encodeURIComponent(symbol)}`);
  const body = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(body)) {
    throw new Error(body?.error ?? `Price request failed (${response.status}) for ${symbol}`);
  }
  if (body.length === 0) {
    throw new Error(`No price data for ${symbol}`);
  }
  return body;
}

// Full history per symbol; timeframes slice it, so switching 1M -> 1Y is free
const historyCache: Map<string, { data: OHLCData[]; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getFullHistory(symbol: string): Promise<OHLCData[]> {
  const cached = historyCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  const data = HYPERLIQUID_CRYPTO.has(symbol)
    ? await fetchHyperliquidCandles(symbol)
    : await fetchViaCandlesApi(symbol);
  historyCache.set(symbol, { data, timestamp: Date.now() });
  return data;
}

// Throws if prices can't be loaded; callers show an error instead of a chart
export async function getAssetOHLCAsync(symbol: string, days: number = 365): Promise<OHLCData[]> {
  if (symbol === 'USD') {
    return usdCandles(days);
  }
  const history = await getFullHistory(symbol);
  const cutoff = Math.floor(Date.now() / 1000) - days * DAY;
  return history.filter((candle) => candle.time >= cutoff);
}

// Calculate synthetic pair OHLC from two assets
export function calculateSyntheticPair(
  baseData: OHLCData[],
  quoteData: OHLCData[]
): OHLCData[] {
  const result: OHLCData[] = [];

  // Create a map of quote data by time for efficient lookup
  const quoteMap = new Map<number, OHLCData>();
  for (const candle of quoteData) {
    quoteMap.set(candle.time, candle);
  }

  // For each base candle, calculate the synthetic pair
  for (const baseCandle of baseData) {
    const quoteCandle = quoteMap.get(baseCandle.time);

    if (quoteCandle && quoteCandle.close > 0) {
      // For OHLC, we need to be careful about how we calculate high/low
      // The high of A/B is not simply high_A / low_B
      // We use close prices for a more stable calculation
      const open = baseCandle.open / quoteCandle.open;
      const close = baseCandle.close / quoteCandle.close;

      // Approximate high/low based on the price movement
      const avgQuote = (quoteCandle.open + quoteCandle.close) / 2;
      const high = baseCandle.high / avgQuote;
      const low = baseCandle.low / avgQuote;

      result.push({
        time: baseCandle.time,
        open,
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close,
        volume: baseCandle.volume,
      });
    }
  }

  return result;
}

// Convert OHLCData to lightweight-charts CandlestickData format
export function toChartData(data: OHLCData[]): CandlestickData<Time>[] {
  return data.map(candle => ({
    time: candle.time as Time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }));
}

// Get current price info for display
export function getPriceInfo(data: OHLCData[]): {
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
} {
  if (data.length === 0) {
    return { price: 0, change: 0, changePercent: 0, high24h: 0, low24h: 0 };
  }

  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : latest;

  const change = latest.close - previous.close;
  const changePercent = (change / previous.close) * 100;

  // Get 24h high/low (last candle for daily data)
  const high24h = latest.high;
  const low24h = latest.low;

  return {
    price: latest.close,
    change,
    changePercent,
    high24h,
    low24h,
  };
}
