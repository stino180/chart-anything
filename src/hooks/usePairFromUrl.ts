import { useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { type Asset, getAssetBySymbol } from '@/data/assets';
import { isTimeframe, type Timeframe } from '@/components/chart/TimeframeSelector';

// The URL is the source of truth for the ratio view so every chart is
// shareable: /BTC-XRP, /ETH-GOLD?tf=ALL. "/" shows the default pair.
const DEFAULT_PAIR = 'BTC-XRP';
const DEFAULT_TIMEFRAME: Timeframe = '1Y';

function parsePair(pair: string): [Asset, Asset] | null {
  const [baseSymbol, quoteSymbol, ...rest] = pair.split('-');
  if (!baseSymbol || !quoteSymbol || rest.length > 0) return null;
  const base = getAssetBySymbol(baseSymbol);
  const quote = getAssetBySymbol(quoteSymbol);
  return base && quote ? [base, quote] : null;
}

export function pairPath(base: Asset, quote: Asset, timeframe: Timeframe = DEFAULT_TIMEFRAME): string {
  const query = timeframe === DEFAULT_TIMEFRAME ? '' : `?tf=${timeframe}`;
  return `/${base.symbol}-${quote.symbol}${query}`;
}

export function usePairFromUrl() {
  const { pair } = useParams<{ pair?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const parsed = pair ? parsePair(pair) : null;
  // Fall back so the page always has a pair, even for a bad link
  const [baseAsset, quoteAsset] = parsed ?? parsePair(DEFAULT_PAIR)!;
  const tf = searchParams.get('tf');
  const timeframe: Timeframe = isTimeframe(tf) ? tf : DEFAULT_TIMEFRAME;

  useEffect(() => {
    if (pair && !parsed) navigate('/', { replace: true });
  }, [pair, parsed, navigate]);

  // replace, not push: picking assets shouldn't fill the back-button history
  const setPair = useCallback(
    (base: Asset, quote: Asset) => navigate(pairPath(base, quote, timeframe), { replace: true }),
    [navigate, timeframe],
  );
  const setTimeframe = useCallback(
    (next: Timeframe) => navigate(pairPath(baseAsset, quoteAsset, next), { replace: true }),
    [navigate, baseAsset, quoteAsset],
  );

  return { baseAsset, quoteAsset, timeframe, setPair, setTimeframe };
}
