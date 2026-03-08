import { useState, useEffect } from 'react';
import { type Asset, getAssetBySymbol } from '@/data/assets';
import { PairSelector } from '@/components/chart/PairSelector';
import { CandlestickChart } from '@/components/chart/CandlestickChart';
import { PriceDisplay } from '@/components/chart/PriceDisplay';
import { TimeframeSelector, getTimeframeDays, type Timeframe } from '@/components/chart/TimeframeSelector';
import { PresetPairs } from '@/components/chart/PresetPairs';
import { CorrelationWidget } from '@/components/chart/CorrelationWidget';
import { CompareMode } from '@/components/chart/CompareMode';
import {
  getAssetOHLCAsync,
  calculateSyntheticPair,
  toChartData,
  getPriceInfo,
  type OHLCData,
} from '@/lib/chartData';
import { Activity, Zap, Loader2, BarChart3, LineChart } from 'lucide-react';
import type { CandlestickData, Time } from 'lightweight-charts';

type ViewMode = 'ratio' | 'compare';

export default function Index() {
  const [viewMode, setViewMode] = useState<ViewMode>('ratio');
  const [baseAsset, setBaseAsset] = useState<Asset | null>(getAssetBySymbol('BTC') ?? null);
  const [quoteAsset, setQuoteAsset] = useState<Asset | null>(getAssetBySymbol('XRP') ?? null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<CandlestickData<Time>[]>([]);
  const [priceInfo, setPriceInfo] = useState<{
    price: number;
    change: number;
    changePercent: number;
    high24h: number;
    low24h: number;
  } | null>(null);
  const [baseOHLC, setBaseOHLC] = useState<OHLCData[] | null>(null);
  const [quoteOHLC, setQuoteOHLC] = useState<OHLCData[] | null>(null);

  const handleSwap = () => {
    const temp = baseAsset;
    setBaseAsset(quoteAsset);
    setQuoteAsset(temp);
  };

  const handlePresetSelect = (base: Asset, quote: Asset) => {
    setBaseAsset(base);
    setQuoteAsset(quote);
  };

  // Fetch data when assets or timeframe change
  useEffect(() => {
    async function fetchData() {
      if (!baseAsset || !quoteAsset) {
        setChartData([]);
        setPriceInfo(null);
        setBaseOHLC(null);
        setQuoteOHLC(null);
        return;
      }

      setIsLoading(true);

      try {
        const days = getTimeframeDays(timeframe);

        const [baseData, quoteData] = await Promise.all([
          getAssetOHLCAsync(baseAsset.symbol, days),
          getAssetOHLCAsync(quoteAsset.symbol, days),
        ]);

        const syntheticOHLC = calculateSyntheticPair(baseData, quoteData);
        const newChartData = toChartData(syntheticOHLC);
        const newPriceInfo = getPriceInfo(syntheticOHLC);

        setChartData(newChartData);
        setPriceInfo(newPriceInfo);
        setBaseOHLC(baseData);
        setQuoteOHLC(quoteData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [baseAsset, quoteAsset, timeframe]);

  const pairName = baseAsset && quoteAsset
    ? `${baseAsset.symbol}/${quoteAsset.symbol}`
    : 'Select a Pair';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-outfit text-xl font-bold text-foreground">
                  Chart Anything
                </h1>
                <p className="text-xs text-muted-foreground">
                  Create synthetic pairs between any assets
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-border p-0.5 bg-secondary/50">
                <button
                  type="button"
                  onClick={() => setViewMode('ratio')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'ratio' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Ratio
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compare')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'compare' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <LineChart className="h-4 w-4" />
                  Compare
                </button>
              </div>
              <span className="h-2 w-2 rounded-full bg-primary animate-live-pulse hidden sm:block" />
              <span className="hidden sm:inline text-xs text-muted-foreground">Live Data</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {viewMode === 'compare' ? (
          <CompareMode />
        ) : (
          <div className="flex gap-6">
            <div className="hidden md:block">
              <PresetPairs
                baseAsset={baseAsset}
                quoteAsset={quoteAsset}
                onSelectPair={handlePresetSelect}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-6">
              {/* Mobile preset pairs - horizontal scroll */}
              <div className="md:hidden">
                <PresetPairs
                  baseAsset={baseAsset}
                  quoteAsset={quoteAsset}
                  onSelectPair={handlePresetSelect}
                  horizontal
                />
              </div>
              {/* Pair selector card */}
              <div className="bg-card border border-border rounded-xl p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    Build Your Pair
                  </span>
                </div>
                <PairSelector
                  baseAsset={baseAsset}
                  quoteAsset={quoteAsset}
                  onBaseChange={setBaseAsset}
                  onQuoteChange={setQuoteAsset}
                  onSwap={handleSwap}
                />
              </div>

              {/* Chart section */}
              {baseAsset && quoteAsset ? (
                <div className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in-up">
                  {/* Price header */}
                  <div className="p-4 md:p-6 border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {isLoading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-muted-foreground">Loading {pairName} data...</span>
                        </div>
                      ) : priceInfo ? (
                        <PriceDisplay
                          price={priceInfo.price}
                          change={priceInfo.change}
                          changePercent={priceInfo.changePercent}
                          high24h={priceInfo.high24h}
                          low24h={priceInfo.low24h}
                          baseSymbol={baseAsset.symbol}
                          quoteSymbol={quoteAsset.symbol}
                        />
                      ) : null}
                      <TimeframeSelector value={timeframe} onChange={setTimeframe} />
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="p-2 md:p-4 relative">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Fetching real-time data...</span>
                        </div>
                      </div>
                    )}
                    <CandlestickChart data={chartData} height={450} />
                  </div>

                  {/* Chart footer */}
                  <div className="px-4 md:px-6 pb-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Synthetic pair: 1 {baseAsset.symbol} = {priceInfo?.price.toFixed(6) ?? '...'} {quoteAsset.symbol}
                    </span>
                    <span className="font-mono">
                      {chartData.length} data points
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Select Your Assets
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Choose a base and quote asset above to create a synthetic pair chart.
                    You can pair any assets together - crypto, stocks, forex, commodities, and more.
                  </p>
                </div>
              )}

              {/* Correlation widget - below chart */}
              {baseOHLC && quoteOHLC && baseAsset && quoteAsset && (
                <CorrelationWidget
                  baseOHLC={baseOHLC}
                  quoteOHLC={quoteOHLC}
                  baseSymbol={baseAsset.symbol}
                  quoteSymbol={quoteAsset.symbol}
                />
              )}

              {/* Info section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard
                  title="Synthetic Pairs"
                  description="Create custom pairs by dividing any two asset prices. See how BTC performs against XRP, or AAPL against gold."
                />
                <InfoCard
                  title="Real Data"
                  description="Live OHLC data from Financial Modeling Prep API. High/Low/Open/Close are all properly calculated."
                />
                <InfoCard
                  title="Any Combination"
                  description="Mix crypto, stocks, forex, commodities, and indices. The possibilities are endless."
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center text-xs text-muted-foreground">
          <p>Chart Anything — Create synthetic pairs between any assets</p>
        </div>
      </footer>
    </div>
  );
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h4 className="font-medium text-foreground mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
