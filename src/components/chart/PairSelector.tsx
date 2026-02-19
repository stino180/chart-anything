import { type Asset } from '@/data/assets';
import { AssetSearch } from './AssetSearch';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight } from 'lucide-react';

interface PairSelectorProps {
  baseAsset: Asset | null;
  quoteAsset: Asset | null;
  onBaseChange: (asset: Asset) => void;
  onQuoteChange: (asset: Asset) => void;
  onSwap: () => void;
}

export function PairSelector({
  baseAsset,
  quoteAsset,
  onBaseChange,
  onQuoteChange,
  onSwap,
}: PairSelectorProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
      <div className="flex-1">
        <AssetSearch
          value={baseAsset}
          onChange={onBaseChange}
          label="Base Asset"
          placeholder="e.g. BTC, ETH, AAPL..."
          excludeSymbol={quoteAsset?.symbol}
        />
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onSwap}
        disabled={!baseAsset || !quoteAsset}
        className="self-center md:self-auto h-11 w-11 border-border hover:border-primary hover:bg-primary/10 transition-colors"
        title="Swap pair"
      >
        <ArrowLeftRight className="h-4 w-4" />
      </Button>

      <div className="flex-1">
        <AssetSearch
          value={quoteAsset}
          onChange={onQuoteChange}
          label="Quote Asset"
          placeholder="e.g. USD, XRP, GOLD..."
          excludeSymbol={baseAsset?.symbol}
        />
      </div>
    </div>
  );
}
