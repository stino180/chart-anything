import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceDisplayProps {
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  baseSymbol: string;
  quoteSymbol: string;
}

function formatPrice(price: number): string {
  if (price === 0) return '0.00';

  // Determine appropriate decimal places based on price magnitude
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  if (price >= 0.01) return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
  return price.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
}

export function PriceDisplay({
  price,
  change,
  changePercent,
  high24h,
  low24h,
  baseSymbol,
  quoteSymbol,
}: PriceDisplayProps) {
  const isPositive = change >= 0;

  return (
    <div className="flex flex-wrap items-start gap-6 md:gap-10">
      {/* Main price */}
      <div>
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
          {baseSymbol}/{quoteSymbol}
        </div>
        <div className="font-mono text-3xl md:text-4xl font-bold text-foreground">
          {formatPrice(price)}
        </div>
      </div>

      {/* Change indicator */}
      <div>
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
          24h Change
        </div>
        <div
          className={cn(
            'flex items-center gap-2 font-mono text-lg md:text-xl font-semibold',
            isPositive ? 'text-primary text-glow-green' : 'text-destructive text-glow-red'
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-5 w-5" />
          ) : (
            <TrendingDown className="h-5 w-5" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 24h High */}
      <div className="hidden md:block">
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
          24h High
        </div>
        <div className="font-mono text-lg text-foreground">
          {formatPrice(high24h)}
        </div>
      </div>

      {/* 24h Low */}
      <div className="hidden md:block">
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
          24h Low
        </div>
        <div className="font-mono text-lg text-foreground">
          {formatPrice(low24h)}
        </div>
      </div>
    </div>
  );
}
