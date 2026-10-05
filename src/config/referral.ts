// Hyperliquid referral code. Leave empty to hide the "Trade on Hyperliquid" button.
export const HYPERLIQUID_REFERRAL_CODE = '';

export const HYPERLIQUID_REFERRAL_URL = HYPERLIQUID_REFERRAL_CODE
  ? `https://app.hyperliquid.xyz/join/${HYPERLIQUID_REFERRAL_CODE}`
  : '';
