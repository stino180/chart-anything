import type { CandlestickData, Time } from 'lightweight-charts';

export interface OHLCData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

// Map our symbols to FMP symbols
function getFMPSymbol(symbol: string, type: string): string {
  // Crypto symbols need USD suffix
  if (type === 'crypto') {
    return `${symbol}USD`;
  }
  // Forex symbols need USD pair
  if (type === 'forex' && symbol !== 'USD') {
    return `${symbol}USD`;
  }
  // Commodities mapping
  if (type === 'commodity') {
    const commodityMap: Record<string, string> = {
      'GOLD': 'GCUSD',
      'SILVER': 'SIUSD',
      'OIL': 'CLUSD',
    };
    return commodityMap[symbol] || symbol;
  }
  // Indices mapping
  if (type === 'index') {
    const indexMap: Record<string, string> = {
      'SPX': '^GSPC',
      'NDX': '^IXIC',
      'DJI': '^DJI',
    };
    return indexMap[symbol] || symbol;
  }
  // Stocks use their symbol directly
  return symbol;
}

// Get asset type from symbol
function getAssetType(symbol: string): string {
  const cryptos = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC', 'UNI', 'ATOM', 'LTC', 'HYPE', 'SUI', 'APT', 'ARB', 'OP', 'INJ', 'FTM'];
  const forex = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
  const commodities = ['GOLD', 'SILVER', 'OIL'];
  const indices = ['SPX', 'NDX', 'DJI'];

  if (cryptos.includes(symbol)) return 'crypto';
  if (forex.includes(symbol)) return 'forex';
  if (commodities.includes(symbol)) return 'commodity';
  if (indices.includes(symbol)) return 'index';
  return 'stock';
}

// Fetch historical data from FMP API
async function fetchFMPData(symbol: string, days: number): Promise<OHLCData[]> {
  const type = getAssetType(symbol);
  const fmpSymbol = getFMPSymbol(symbol, type);

  // Special case for USD - it's always 1
  if (symbol === 'USD') {
    return generateUSDData(days);
  }

  try {
    // New stable API endpoint
    const endpoint = `${FMP_BASE_URL}/historical-price-eod/full?symbol=${fmpSymbol}&apikey=${FMP_API_KEY}`;

    console.log(`Fetching ${symbol} (${fmpSymbol}) from FMP API...`);
    const response = await fetch(endpoint);

    if (!response.ok) {
      console.error(`FMP API error for ${symbol}: ${response.status}`);
      return generateFallbackData(symbol, days);
    }

    const data = await response.json();

    // New API returns array directly
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`No historical data for ${symbol}, using fallback`);
      return generateFallbackData(symbol, days);
    }

    // Convert FMP data to our format
    // FMP returns data in descending order (newest first), we need ascending
    const historical = data.slice(0, days).reverse();

    return historical.map((candle: { date: string; open: number; high: number; low: number; close: number; volume?: number }) => ({
      time: new Date(candle.date).getTime() / 1000,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    }));
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return generateFallbackData(symbol, days);
  }
}

// Generate USD data (always 1)
function generateUSDData(days: number): OHLCData[] {
  const data: OHLCData[] = [];
  const now = Math.floor(Date.now() / 1000);
  const dayInSeconds = 86400;

  for (let i = days; i >= 0; i--) {
    const time = now - (i * dayInSeconds);
    data.push({
      time,
      open: 1,
      high: 1,
      low: 1,
      close: 1,
      volume: 0,
    });
  }

  return data;
}

// Fallback data generator for when API fails
function generateFallbackData(symbol: string, days: number): OHLCData[] {
  const params = FALLBACK_PARAMS[symbol.toUpperCase()] || { price: 100, volatility: 0.05 };
  return generateMockOHLC(params.price, params.volatility, days);
}

// Generate realistic mock OHLC data for an asset (fallback)
function generateMockOHLC(
  basePrice: number,
  volatility: number,
  days: number = 365
): OHLCData[] {
  const data: OHLCData[] = [];
  const now = Math.floor(Date.now() / 1000);
  const dayInSeconds = 86400;

  let price = basePrice;

  for (let i = days; i >= 0; i--) {
    const time = now - (i * dayInSeconds);

    // Random walk with some trend
    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    price = Math.max(price + change, basePrice * 0.1);
    const close = price;

    // Generate realistic high/low
    const range = Math.abs(close - open) + (Math.random() * volatility * price * 0.5);
    const high = Math.max(open, close) + range * Math.random();
    const low = Math.min(open, close) - range * Math.random();

    data.push({
      time,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
      volume: Math.random() * 1000000000,
    });
  }

  return data;
}

// Fallback prices and volatilities for different assets
const FALLBACK_PARAMS: Record<string, { price: number; volatility: number }> = {
  // Crypto
  BTC: { price: 95000, volatility: 0.04 },
  ETH: { price: 3200, volatility: 0.05 },
  XRP: { price: 2.5, volatility: 0.06 },
  SOL: { price: 180, volatility: 0.07 },
  ADA: { price: 0.85, volatility: 0.06 },
  DOGE: { price: 0.32, volatility: 0.08 },
  AVAX: { price: 35, volatility: 0.07 },
  DOT: { price: 7, volatility: 0.06 },
  LINK: { price: 22, volatility: 0.06 },
  MATIC: { price: 0.45, volatility: 0.07 },
  UNI: { price: 12, volatility: 0.07 },
  ATOM: { price: 9, volatility: 0.06 },
  LTC: { price: 100, volatility: 0.05 },
  HYPE: { price: 24, volatility: 0.09 },
  SUI: { price: 4.5, volatility: 0.08 },
  APT: { price: 9, volatility: 0.07 },
  ARB: { price: 0.75, volatility: 0.08 },
  OP: { price: 1.8, volatility: 0.08 },
  INJ: { price: 22, volatility: 0.08 },
  FTM: { price: 0.7, volatility: 0.09 },

  // Stocks
  AAPL: { price: 230, volatility: 0.02 },
  MSFT: { price: 420, volatility: 0.02 },
  GOOGL: { price: 190, volatility: 0.025 },
  AMZN: { price: 220, volatility: 0.025 },
  NVDA: { price: 140, volatility: 0.04 },
  TSLA: { price: 410, volatility: 0.05 },
  META: { price: 600, volatility: 0.03 },
  AMD: { price: 120, volatility: 0.04 },
  NFLX: { price: 900, volatility: 0.035 },
  CRM: { price: 340, volatility: 0.03 },

  // Forex (vs USD)
  USD: { price: 1, volatility: 0 },
  EUR: { price: 1.08, volatility: 0.005 },
  GBP: { price: 1.27, volatility: 0.006 },
  JPY: { price: 0.0065, volatility: 0.005 },
  CHF: { price: 1.12, volatility: 0.004 },
  CAD: { price: 0.71, volatility: 0.005 },
  AUD: { price: 0.63, volatility: 0.006 },

  // Commodities
  GOLD: { price: 2650, volatility: 0.01 },
  SILVER: { price: 31, volatility: 0.02 },
  OIL: { price: 72, volatility: 0.03 },

  // Indices
  SPX: { price: 6000, volatility: 0.01 },
  NDX: { price: 21000, volatility: 0.015 },
  DJI: { price: 44000, volatility: 0.01 },
};

// Cache for fetched data
const dataCache: Map<string, { data: OHLCData[]; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getAssetOHLCAsync(symbol: string, days: number = 365): Promise<OHLCData[]> {
  const cacheKey = `${symbol}-${days}`;
  const cached = dataCache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFMPData(symbol, days);

  dataCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

// Synchronous version that returns cached data or fallback (for backwards compatibility)
export function getAssetOHLC(symbol: string, days: number = 365): OHLCData[] {
  const cacheKey = `${symbol}-${days}`;
  const cached = dataCache.get(cacheKey);

  if (cached) {
    return cached.data;
  }

  // Return fallback data immediately, async fetch will update cache
  return generateFallbackData(symbol, days);
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
