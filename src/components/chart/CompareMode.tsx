import { useState, useEffect } from 'react';
import { AssetSearch } from '@/components/chart/AssetSearch';
import { MultiAssetChart, type AssetSeries } from '@/components/chart/MultiAssetChart';
import { TimeframeSelector, getTimeframeDays, type Timeframe } from '@/components/chart/TimeframeSelector';
import { getAssetOHLCAsync } from '@/lib/chartData';
import { getAssetBySymbol, type Asset } from '@/data/assets';
import type { Time } from 'lightweight-charts';
import { Loader2, X } from 'lucide-react';

const COLORS = ['hsl(142, 70%, 45%)', 'hsl(210, 90%, 55%)', 'hsl(35, 90%, 55%)', 'hsl(280, 70%, 60%)'];

export function CompareMode() {
  const [assets, setAssets] = useState<Asset[]>(() => {
    const btc = getAssetBySymbol('BTC');
    const eth = getAssetBySymbol('ETH');
    return btc && eth ? [btc, eth] : [];
  });
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y');
  const [series, setSeries] = useState<AssetSeries[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (assets.length < 2) {
      setSeries([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    const days = getTimeframeDays(timeframe);
    Promise.all(assets.map((a) => getAssetOHLCAsync(a.symbol, days)))
      .then((ohlcArrays) => {
        if (cancelled) return;
        // Build time -> close map per asset
        const maps = ohlcArrays.map((arr) => {
          const m = new Map<number, number>();
          for (const c of arr) m.set(c.time, c.close);
          return m;
        });
        // Use first asset's timestamps; for each time take each asset's close (nearest if missing: use first asset's times only and look up)
        const times = ohlcArrays[0].map((c) => c.time);
        const result: AssetSeries[] = assets.slice(0, ohlcArrays.length).map((asset, idx) => {
          const map = maps[idx];
          const sortedEntries = [...map.entries()].sort((a, b) => a[0] - b[0]);
          const getClose = (t: number) => {
            const exact = map.get(t);
            if (exact !== undefined) return exact;
            let prev = sortedEntries[0]?.[1];
            for (const [time, close] of sortedEntries) {
              if (time > t) break;
              prev = close;
            }
            return prev ?? 0;
          };
          const firstClose = getClose(times[0]);
          const data = firstClose
            ? times.map((time) => ({
                time: time as Time,
                value: ((getClose(time) - firstClose) / firstClose) * 100,
              }))
            : [];
          const lastClose = getClose(times[times.length - 1]);
          const percentChange = firstClose ? ((lastClose - firstClose) / firstClose) * 100 : 0;
          return {
            symbol: asset.symbol,
            color: COLORS[idx % COLORS.length],
            data,
            percentChange,
          };
        });
        setSeries(result);
      })
      .catch(() => setSeries([]))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assets, timeframe]);

  const addAsset = (asset: Asset) => {
    if (assets.length >= 4 || assets.some((a) => a.symbol === asset.symbol)) return;
    setAssets((prev) => [...prev, asset]);
  };

  const removeAsset = (index: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Compare assets (% growth from start)</h3>
        <div className="flex flex-wrap items-end gap-4">
          {assets.map((asset, i) => (
            <div key={`${asset.symbol}-${i}`} className="flex items-end gap-2">
              <div className="w-48">
                <AssetSearch
                  value={asset}
                  onChange={(a) => setAssets((prev) => prev.map((p, j) => (j === i ? a : p)))}
                  label={`Asset ${i + 1}`}
                  excludeSymbols={assets.filter((_, j) => j !== i).map((a) => a.symbol)}
                />
              </div>
              {assets.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeAsset(i)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border hover:border-destructive/50"
                  aria-label="Remove asset"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {assets.length < 4 && (
            <div className="w-48">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                Add asset
              </label>
              <AssetSearch
                value={null}
                onChange={addAsset}
                label=""
                placeholder="Add..."
                excludeSymbols={assets.map((a) => a.symbol)}
              />
            </div>
          )}
        </div>
        <div className="mt-4">
          <TimeframeSelector value={timeframe} onChange={setTimeframe} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading compare data...</span>
          </div>
        ) : (
          <MultiAssetChart series={series} height={450} />
        )}
      </div>
    </div>
  );
}
