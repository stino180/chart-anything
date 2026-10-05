import { ExternalLink } from 'lucide-react';
import { HYPERLIQUID_REFERRAL_URL } from '@/config/referral';

export function TradeOnHyperliquid() {
  if (!HYPERLIQUID_REFERRAL_URL) return null;

  return (
    <a
      href={HYPERLIQUID_REFERRAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-xs font-medium text-primary hover:bg-primary/25 transition-colors"
    >
      Trade on Hyperliquid
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
