import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type LineWidth,
} from 'lightweight-charts';

export interface AssetSeries {
  symbol: string;
  color: string;
  data: LineData<Time>[];
  percentChange: number;
}

const COLORS = ['hsl(142, 70%, 45%)', 'hsl(210, 90%, 55%)', 'hsl(35, 90%, 55%)', 'hsl(280, 70%, 60%)'];

interface MultiAssetChartProps {
  series: AssetSeries[];
  height?: number;
}

export function MultiAssetChart({ series, height = 400 }: MultiAssetChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<'Line'>[]>([]);

  useEffect(() => {
    if (!containerRef.current || series.length === 0) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(220, 10%, 50%)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'hsl(220, 20%, 12%)' },
        horzLines: { color: 'hsl(220, 20%, 12%)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'hsl(210, 20%, 40%)',
          width: 1 as LineWidth,
          style: 2,
          labelBackgroundColor: 'hsl(220, 20%, 12%)',
        },
        horzLine: {
          color: 'hsl(210, 20%, 40%)',
          width: 1 as LineWidth,
          style: 2,
          labelBackgroundColor: 'hsl(220, 20%, 12%)',
        },
      },
      timeScale: {
        borderColor: 'hsl(220, 20%, 14%)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'hsl(220, 20%, 14%)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const refs: ISeriesApi<'Line'>[] = [];
    series.forEach((s, i) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: s.color,
        lineWidth: 2,
        title: s.symbol,
      });
      lineSeries.setData(s.data);
      refs.push(lineSeries);
    });

    chartRef.current = chart;
    seriesRefs.current = refs;

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
    };
  }, [height, series.length]);

  useEffect(() => {
    if (seriesRefs.current.length !== series.length || series.length === 0) return;
    series.forEach((s, i) => {
      const api = seriesRefs.current[i];
      if (api && s.data.length > 0) {
        api.setData(s.data);
      }
    });
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [series]);

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-secondary/30 border border-border" style={{ height }}>
        <p className="text-sm text-muted-foreground">Add 2–4 assets to compare</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-sm">
        {series.map((s) => (
          <div key={s.symbol} className="flex items-center gap-2">
            <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-mono font-medium text-foreground">{s.symbol}</span>
            <span className={s.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}>
              {s.percentChange >= 0 ? '+' : ''}{s.percentChange.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height }}
      />
    </div>
  );
}
