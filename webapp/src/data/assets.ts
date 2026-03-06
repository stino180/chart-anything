export interface Asset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index';
  icon?: string;
}

export const ASSETS: Asset[] = [
  // Cryptocurrencies
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
  { symbol: 'XRP', name: 'Ripple', type: 'crypto' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto' },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto' },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto' },
  { symbol: 'AVAX', name: 'Avalanche', type: 'crypto' },
  { symbol: 'DOT', name: 'Polkadot', type: 'crypto' },
  { symbol: 'LINK', name: 'Chainlink', type: 'crypto' },
  { symbol: 'MATIC', name: 'Polygon', type: 'crypto' },
  { symbol: 'UNI', name: 'Uniswap', type: 'crypto' },
  { symbol: 'ATOM', name: 'Cosmos', type: 'crypto' },
  { symbol: 'LTC', name: 'Litecoin', type: 'crypto' },
  { symbol: 'HYPE', name: 'Hyperliquid', type: 'crypto' },
  { symbol: 'SUI', name: 'Sui', type: 'crypto' },
  { symbol: 'APT', name: 'Aptos', type: 'crypto' },
  { symbol: 'ARB', name: 'Arbitrum', type: 'crypto' },
  { symbol: 'OP', name: 'Optimism', type: 'crypto' },
  { symbol: 'INJ', name: 'Injective', type: 'crypto' },
  { symbol: 'FTM', name: 'Fantom', type: 'crypto' },

  // Stocks - Tech
  { symbol: 'AAPL', name: 'Apple', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
  { symbol: 'META', name: 'Meta', type: 'stock' },
  { symbol: 'AMD', name: 'AMD', type: 'stock' },
  { symbol: 'NFLX', name: 'Netflix', type: 'stock' },
  { symbol: 'CRM', name: 'Salesforce', type: 'stock' },
  { symbol: 'INTC', name: 'Intel', type: 'stock' },
  { symbol: 'ORCL', name: 'Oracle', type: 'stock' },
  { symbol: 'ADBE', name: 'Adobe', type: 'stock' },
  { symbol: 'CSCO', name: 'Cisco', type: 'stock' },
  { symbol: 'AVGO', name: 'Broadcom', type: 'stock' },
  { symbol: 'QCOM', name: 'Qualcomm', type: 'stock' },
  { symbol: 'IBM', name: 'IBM', type: 'stock' },
  { symbol: 'UBER', name: 'Uber', type: 'stock' },
  { symbol: 'SPOT', name: 'Spotify', type: 'stock' },
  { symbol: 'SNAP', name: 'Snap', type: 'stock' },
  { symbol: 'SHOP', name: 'Shopify', type: 'stock' },
  { symbol: 'SQ', name: 'Block', type: 'stock' },
  { symbol: 'PYPL', name: 'PayPal', type: 'stock' },
  { symbol: 'PLTR', name: 'Palantir', type: 'stock' },
  { symbol: 'COIN', name: 'Coinbase', type: 'stock' },
  { symbol: 'HOOD', name: 'Robinhood', type: 'stock' },

  // Stocks - Finance
  { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock' },
  { symbol: 'BAC', name: 'Bank of America', type: 'stock' },
  { symbol: 'WFC', name: 'Wells Fargo', type: 'stock' },
  { symbol: 'GS', name: 'Goldman Sachs', type: 'stock' },
  { symbol: 'MS', name: 'Morgan Stanley', type: 'stock' },
  { symbol: 'V', name: 'Visa', type: 'stock' },
  { symbol: 'MA', name: 'Mastercard', type: 'stock' },
  { symbol: 'AXP', name: 'American Express', type: 'stock' },

  // Stocks - Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock' },
  { symbol: 'UNH', name: 'UnitedHealth', type: 'stock' },
  { symbol: 'PFE', name: 'Pfizer', type: 'stock' },
  { symbol: 'ABBV', name: 'AbbVie', type: 'stock' },
  { symbol: 'MRK', name: 'Merck', type: 'stock' },
  { symbol: 'LLY', name: 'Eli Lilly', type: 'stock' },
  { symbol: 'TMO', name: 'Thermo Fisher', type: 'stock' },

  // Stocks - Consumer
  { symbol: 'WMT', name: 'Walmart', type: 'stock' },
  { symbol: 'COST', name: 'Costco', type: 'stock' },
  { symbol: 'HD', name: 'Home Depot', type: 'stock' },
  { symbol: 'MCD', name: 'McDonald\'s', type: 'stock' },
  { symbol: 'SBUX', name: 'Starbucks', type: 'stock' },
  { symbol: 'NKE', name: 'Nike', type: 'stock' },
  { symbol: 'DIS', name: 'Disney', type: 'stock' },
  { symbol: 'KO', name: 'Coca-Cola', type: 'stock' },
  { symbol: 'PEP', name: 'PepsiCo', type: 'stock' },
  { symbol: 'PG', name: 'Procter & Gamble', type: 'stock' },

  // Stocks - Industrial & Energy
  { symbol: 'XOM', name: 'Exxon Mobil', type: 'stock' },
  { symbol: 'CVX', name: 'Chevron', type: 'stock' },
  { symbol: 'BA', name: 'Boeing', type: 'stock' },
  { symbol: 'CAT', name: 'Caterpillar', type: 'stock' },
  { symbol: 'GE', name: 'General Electric', type: 'stock' },
  { symbol: 'LMT', name: 'Lockheed Martin', type: 'stock' },
  { symbol: 'UPS', name: 'UPS', type: 'stock' },
  { symbol: 'FDX', name: 'FedEx', type: 'stock' },

  // Forex
  { symbol: 'USD', name: 'US Dollar', type: 'forex' },
  { symbol: 'EUR', name: 'Euro', type: 'forex' },
  { symbol: 'GBP', name: 'British Pound', type: 'forex' },
  { symbol: 'JPY', name: 'Japanese Yen', type: 'forex' },
  { symbol: 'CHF', name: 'Swiss Franc', type: 'forex' },
  { symbol: 'CAD', name: 'Canadian Dollar', type: 'forex' },
  { symbol: 'AUD', name: 'Australian Dollar', type: 'forex' },

  // Commodities
  { symbol: 'GOLD', name: 'Gold', type: 'commodity' },
  { symbol: 'SILVER', name: 'Silver', type: 'commodity' },
  { symbol: 'OIL', name: 'Crude Oil', type: 'commodity' },

  // Indices
  { symbol: 'SPX', name: 'S&P 500', type: 'index' },
  { symbol: 'NDX', name: 'Nasdaq 100', type: 'index' },
  { symbol: 'DJI', name: 'Dow Jones', type: 'index' },
];

export function getAssetBySymbol(symbol: string): Asset | undefined {
  return ASSETS.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
}

export function searchAssets(query: string): Asset[] {
  const q = query.toLowerCase();
  return ASSETS.filter(
    a => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
  );
}

export function getTypeColor(type: Asset['type']): string {
  switch (type) {
    case 'crypto': return 'text-primary';
    case 'stock': return 'text-blue-400';
    case 'forex': return 'text-yellow-400';
    case 'commodity': return 'text-orange-400';
    case 'index': return 'text-purple-400';
    default: return 'text-muted-foreground';
  }
}

export function getTypeBadgeColor(type: Asset['type']): string {
  switch (type) {
    case 'crypto': return 'bg-primary/20 text-primary';
    case 'stock': return 'bg-blue-400/20 text-blue-400';
    case 'forex': return 'bg-yellow-400/20 text-yellow-400';
    case 'commodity': return 'bg-orange-400/20 text-orange-400';
    case 'index': return 'bg-purple-400/20 text-purple-400';
    default: return 'bg-muted text-muted-foreground';
  }
}
