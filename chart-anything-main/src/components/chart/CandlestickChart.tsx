import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type LineWidth,
} from 'lightweight-charts';

interface CandlestickChartProps {
  data: CandlestickData<Time>[];
  height?: number;
}

export function CandlestickChart({ data, height = 500 }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

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
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(142, 70%, 45%)',
      downColor: 'hsl(0, 72%, 51%)',
      borderUpColor: 'hsl(142, 70%, 45%)',
      borderDownColor: 'hsl(0, 72%, 51%)',
      wickUpColor: 'hsl(142, 70%, 45%)',
      wickDownColor: 'hsl(0, 72%, 51%)',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // Update data
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data);

      // Fit content with some padding
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ height }}
    />
  );
}
