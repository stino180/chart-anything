// Cloudflare Pages Function for shareable pair links like /BTC-XRP.
// Link-preview crawlers (X, iMessage, Discord...) don't run JavaScript, so the
// pair-specific title, description and image have to be in the HTML itself.
// Serves the normal SPA page with those meta tags rewritten.
import { getAssetBySymbol } from '../src/data/assets';

// Workers runtime global; not in the DOM typings used for type-checking
declare const HTMLRewriter: new () => {
  on(selector: string, handlers: { element(el: { setAttribute(name: string, value: string): void; setInnerContent(content: string): void }): void }): InstanceType<typeof HTMLRewriter>;
  transform(response: Response): Response;
};

interface Context {
  request: Request;
  params: { pair: string };
  next: () => Promise<Response>;
}

const PAIR = /^([A-Za-z]{1,6})-([A-Za-z]{1,6})$/;

export async function onRequestGet({ request, params, next }: Context): Promise<Response> {
  // Single-segment static files (/favicon.ico, /sw.js...) also land here
  const match = PAIR.exec(params.pair);
  const base = match ? getAssetBySymbol(match[1]) : undefined;
  const quote = match ? getAssetBySymbol(match[2]) : undefined;
  const page = await next();
  if (!base || !quote) return page;

  const origin = new URL(request.url).origin;
  const pairName = `${base.symbol}/${quote.symbol}`;
  const title = `${pairName} chart: ${base.name} priced in ${quote.name} | DuoChart`;
  const description = `Live ${pairName} ratio chart. Chart any asset against any other: crypto, stocks, gold, oil, forex.`;
  // Daily version so platforms that cache previews pick up a fresh chart
  const day = new Date().toISOString().slice(0, 10);
  const image = `${origin}/api/og?pair=${base.symbol}-${quote.symbol}&d=${day}`;
  const url = `${origin}/${base.symbol}-${quote.symbol}`;

  const setContent = (value: string) => ({
    element(el: { setAttribute(name: string, value: string): void }) {
      el.setAttribute('content', value);
    },
  });

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', setContent(description))
    .on('meta[property="og:title"]', setContent(title))
    .on('meta[name="twitter:title"]', setContent(title))
    .on('meta[property="og:description"]', setContent(description))
    .on('meta[name="twitter:description"]', setContent(description))
    .on('meta[property="og:image"]', setContent(image))
    .on('meta[name="twitter:image"]', setContent(image))
    .on('meta[property="og:url"]', setContent(url))
    .transform(page);
}
