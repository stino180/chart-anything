import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ASSETS, searchAssets, getTypeBadgeColor, type Asset } from '@/data/assets';
import { Search, X } from 'lucide-react';

interface AssetSearchProps {
  value: Asset | null;
  onChange: (asset: Asset) => void;
  label: string;
  placeholder?: string;
  excludeSymbol?: string;
  /** When set, exclude all these symbols (e.g. already selected assets in compare mode) */
  excludeSymbols?: string[];
}

export function AssetSearch({
  value,
  onChange,
  label,
  placeholder = 'Search assets...',
  excludeSymbol,
  excludeSymbols,
}: AssetSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const excludeSet = excludeSymbols?.length
    ? new Set(excludeSymbols.map((s) => s.toUpperCase()))
    : excludeSymbol
      ? new Set([excludeSymbol.toUpperCase()])
      : null;
  const filterExcluded = (a: Asset) =>
    !excludeSet || !excludeSet.has(a.symbol.toUpperCase());

  const filteredAssets = query
    ? searchAssets(query).filter(filterExcluded)
    : ASSETS.filter(filterExcluded);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (asset: Asset) => {
    onChange(asset);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
        {label}
      </label>

      {value && !isOpen ? (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 bg-secondary border border-border rounded-lg hover:border-primary/50 transition-colors text-left"
        >
          <div className="flex-1">
            <span className="font-mono text-lg font-semibold text-foreground">
              {value.symbol}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              {value.name}
            </span>
          </div>
          <span className={cn('text-xs px-2 py-0.5 rounded', getTypeBadgeColor(value.type))}>
            {value.type}
          </span>
        </button>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="pl-10 pr-10 py-3 bg-secondary border-border focus:border-primary"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {filteredAssets.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No assets found
            </div>
          ) : (
            <div className="py-1">
              {(['crypto', 'stock', 'forex', 'commodity', 'index'] as const).map((type) => {
                const typeAssets = filteredAssets.filter(a => a.type === type);
                if (typeAssets.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50 sticky top-0">
                      {type === 'crypto' ? 'Cryptocurrencies' : type === 'stock' ? 'Stocks' : type === 'forex' ? 'Forex' : type === 'commodity' ? 'Commodities' : 'Indices'}
                    </div>
                    {typeAssets.map((asset) => (
                      <button
                        key={asset.symbol}
                        onClick={() => handleSelect(asset)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/80 transition-colors text-left',
                          value?.symbol === asset.symbol && 'bg-secondary'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-mono font-semibold text-foreground">
                            {asset.symbol}
                          </span>
                          <span className="ml-2 text-sm text-muted-foreground truncate">
                            {asset.name}
                          </span>
                        </div>
                        <span className={cn('text-xs px-2 py-0.5 rounded flex-shrink-0', getTypeBadgeColor(asset.type))}>
                          {asset.type}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
