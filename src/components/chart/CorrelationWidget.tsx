import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { OHLCData } from '@/lib/chartData';

function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0) return 0;
  return num / den;
}

function alignAndCorrelate(base: OHLCData[], quote: OHLCData[], maxPoints: number): number {
  const byTime = new Map<number, { base: number; quote: number }>();
  for (const c of base) {
    byTime.set(c.time, { base: c.close, quote: 0 });
  }
  for (const c of quote) {
    const existing = byTime.get(c.time);
    if (existing) {
      existing.quote = c.close;
    }
  }
  const aligned = [...byTime.entries()]
    .filter(([, v]) => v.quote > 0)
    .sort((a, b) => a[0] - b[0])
    .slice(-maxPoints);
  if (aligned.length < 2) return 0;
  const x = aligned.map(([, v]) => v.base);
  const y = aligned.map(([, v]) => v.quote);
  return pearsonCorrelation(x, y);
}

interface CorrelationWidgetProps {
  baseOHLC: OHLCData[] | null;
  quoteOHLC: OHLCData[] | null;
  baseSymbol: string;
  quoteSymbol: string;
}

const PERIODS = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
] as const;

export function CorrelationWidget({
  baseOHLC,
  quoteOHLC,
  baseSymbol,
  quoteSymbol,
}: CorrelationWidgetProps) {
  const correlations = useMemo(() => {
    if (!baseOHLC?.length || !quoteOHLC?.length) return null;
    const daySeconds = 86400;
    const latestTime = Math.max(
      baseOHLC[baseOHLC.length - 1]?.time ?? 0,
      quoteOHLC[quoteOHLC.length - 1]?.time ?? 0
    );
    return PERIODS.map(({ label, days }) => {
      const cutoff = latestTime - days * daySeconds;
      const baseSlice = baseOHLC.filter((c) => c.time >= cutoff);
      const quoteSlice = quoteOHLC.filter((c) => c.time >= cutoff);
      const r = alignAndCorrelate(baseSlice, quoteSlice, days * 2);
      return { label, r };
    });
  }, [baseOHLC, quoteOHLC]);

  if (!correlations) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h4 className="text-sm font-medium text-foreground mb-3">Correlation</h4>
      <p className="text-xs text-muted-foreground mb-3">
        How correlated {baseSymbol} and {quoteSymbol} are. Near +1 = move together; near -1 = move opposite.
      </p>
      <div className="flex flex-wrap gap-4">
        {correlations.map(({ label, r }) => {
          const value = Math.round(r * 100) / 100;
          const color =
            value >= 0.5 ? 'text-green-500' : value <= -0.5 ? 'text-red-500' : 'text-yellow-500';
          const interpretation =
            value >= 0.7
              ? 'Highly correlated'
              : value >= 0.3
                ? 'Moderately correlated'
                : value >= -0.3
                  ? 'Weak / neutral'
                  : value >= -0.7
                    ? 'Moderately inverse'
                    : 'Highly inverse';
          return (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className={cn('font-mono font-semibold', color)}>{value}</span>
              <span className="text-xs text-muted-foreground">({interpretation})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
