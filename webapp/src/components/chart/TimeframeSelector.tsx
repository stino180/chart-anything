import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

const TIMEFRAMES: { value: Timeframe; label: string; days: number }[] = [
  { value: '1D', label: '1D', days: 1 },
  { value: '1W', label: '1W', days: 7 },
  { value: '1M', label: '1M', days: 30 },
  { value: '3M', label: '3M', days: 90 },
  { value: '1Y', label: '1Y', days: 365 },
  { value: 'ALL', label: 'ALL', days: 365 },
];

export function getTimeframeDays(timeframe: Timeframe): number {
  const tf = TIMEFRAMES.find(t => t.value === timeframe);
  return tf?.days ?? 365;
}

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
      {TIMEFRAMES.map((tf) => (
        <Button
          key={tf.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(tf.value)}
          className={cn(
            'px-3 py-1.5 h-auto text-xs font-mono font-medium transition-all',
            value === tf.value
              ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {tf.label}
        </Button>
      ))}
    </div>
  );
}
