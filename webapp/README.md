# Chart Anything

A financial charting platform that lets you create synthetic pairs between any assets. Compare BTC/XRP, ETH/HYPE, AAPL/GOLD, and more with professional candlestick charts.

## Features

- **Synthetic Pair Creation**: Combine any two assets to create custom trading pairs
- **Professional Candlestick Charts**: TradingView Lightweight Charts with proper OHLC calculations
- **Multiple Asset Types**: Crypto, stocks, forex, commodities, and indices
- **Timeframe Selection**: 1D, 1W, 1M, 3M, 1Y, and ALL views
- **Swap Button**: Quickly invert your pair (BTC/XRP to XRP/BTC)
- **Live Price Display**: Current price, 24h change, high/low

## How It Works

The app calculates synthetic pairs using the formula:
```
Price(A/B) = Price(A/USD) / Price(B/USD)
```

For candlestick data, OHLC values are calculated properly:
- Open: baseOpen / quoteOpen
- Close: baseClose / quoteClose
- High/Low: Approximated using average quote prices for stability

## Tech Stack

- React + TypeScript + Vite
- TradingView Lightweight Charts v5
- Tailwind CSS + shadcn/ui
- JetBrains Mono + Outfit fonts

## Assets Supported

- **Crypto**: BTC, ETH, XRP, SOL, ADA, DOGE, AVAX, DOT, LINK, MATIC, UNI, ATOM, LTC, HYPE, SUI, APT, ARB, OP, INJ, FTM
- **Stocks**: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META, AMD, NFLX, CRM
- **Forex**: USD, EUR, GBP, JPY, CHF, CAD, AUD
- **Commodities**: GOLD, SILVER, OIL
- **Indices**: SPX (S&P 500), NDX (Nasdaq 100), DJI (Dow Jones)
