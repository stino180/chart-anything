import * as React from 'react';
import { ChevronDown, ChevronRight, Coins, DollarSign, Fuel, Landmark } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getAssetBySymbol, type Asset } from '@/data/assets';


export interface PresetPair {
  baseSymbol: string;
  quoteSymbol: string;
  label: string;
  icon: React.ReactNode;
}

const PRESETS: PresetPair[] = [
  { baseSymbol: 'BTC', quoteSymbol: 'GOLD', label: 'Gold Standard', icon: <Coins className="h-4 w-4" /> },
  { baseSymbol: 'USD', quoteSymbol: 'BTC', label: 'Fiat Burn', icon: <DollarSign className="h-4 w-4" /> },
  { baseSymbol: 'BTC', quoteSymbol: 'OIL', label: 'BTC / Oil', icon: <Fuel className="h-4 w-4" /> },
  { baseSymbol: 'ETH', quoteSymbol: 'GOLD', label: 'ETH / Gold', icon: <Landmark className="h-4 w-4" /> },
];

interface PresetPairsProps {
  baseAsset: Asset | null;
  quoteAsset: Asset | null;
  onSelectPair: (base: Asset, quote: Asset) => void;
  horizontal?: boolean;
}

export function PresetPairs({ baseAsset, quoteAsset, onSelectPair, horizontal = false }: PresetPairsProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handlePreset = (preset: PresetPair) => {
    const base = getAssetBySymbol(preset.baseSymbol);
    const quote = getAssetBySymbol(preset.quoteSymbol);
    if (base && quote) {
      onSelectPair(base, quote);
    }
  };

  const isActive = (preset: PresetPair) =>
    baseAsset?.symbol === preset.baseSymbol && quoteAsset?.symbol === preset.quoteSymbol;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shrink-0 w-56">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
      >
        <span className="text-sm font-medium text-foreground">Quick Pairs</span>
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {!collapsed && (
        <div className="border-t border-border py-1">
          {PRESETS.map((preset) => (
            <button
              key={`${preset.baseSymbol}/${preset.quoteSymbol}`}
              onClick={() => handlePreset(preset)}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors',
                isActive(preset)
                  ? 'bg-primary/15 text-primary'
                  : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-muted-foreground">{preset.icon}</span>
              <span className="font-mono text-xs">{preset.baseSymbol}/{preset.quoteSymbol}</span>
              <span className="truncate text-xs">{preset.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
