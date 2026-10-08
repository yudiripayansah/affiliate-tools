// app/api/outbound/route.js
import { NextResponse, after } from 'next/server';
import { getOutboundLink, logClick, MARKETPLACES } from '@/lib/db';

// Tanpa `export const dynamic`: dengan cacheComponents (default Next 16), route yang membaca request otomatis dinamis.

const SLUG = /^[a-z0-9-]{1,100}$/;
// ponytail: regex bot filter sederhana; ganti ke bot detection proper bila ada click fraud
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;
const clip = (v, n) => (v ? v.slice(0, n) : null);

export async function GET(req) {
  const q = req.nextUrl.searchParams;
  const slug = q.get('p') ?? '';
  const marketplace = q.get('m') ?? '';

  if (!SLUG.test(slug) || !MARKETPLACES.includes(marketplace)) {
    return new NextResponse('Bad request', { status: 400 });
  }

  const link = await getOutboundLink(slug, marketplace);
  if (!link) return new NextResponse('Not found', { status: 404 });

  const ua = req.headers.get('user-agent') ?? '';
  const event = {
    product_id: link.productId,
    marketplace,
    source: clip(q.get('src'), 50),
    referrer: clip(req.headers.get('referer'), 500),
    user_agent: clip(ua, 500),
    ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim(),
    country: req.headers.get('x-vercel-ip-country'),
    utm_source: clip(q.get('utm_source'), 100),
    utm_medium: clip(q.get('utm_medium'), 100),
    utm_campaign: clip(q.get('utm_campaign'), 100),
    is_bot: BOT.test(ua),
  };

  // Logging setelah response terkirim -> redirect tidak menunggu DB.
  after(() => logClick(event));

  // Tujuan redirect HANYA dari DB (bukan query string) -> tidak ada open redirect.
  return NextResponse.redirect(link.url, {
    status: 302,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}
