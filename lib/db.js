// lib/db.js — outbound & pencatatan klik. HANYA dari Route Handlers / server.
import { createHash } from 'node:crypto';
import { db, MARKETPLACES } from '@/lib/supabase';

export { MARKETPLACES };

// ---------- Outbound ----------

export async function getOutboundLink(slug, marketplace) {
  const { data, error } = await db
    .from('product_links')
    .select('url, marketplace, product:products!inner(id, slug, is_active)')
    .eq('product.slug', slug)
    .eq('product.is_active', true)
    .eq('marketplace', marketplace)
    .maybeSingle();
  if (error) throw error;
  return data && { productId: data.product.id, url: data.url };
}

export async function logClick(event) {
  const { ip, ...rest } = event;
  const { error } = await db.from('click_events').insert({
    ...rest,
    ip_hash: ip ? createHash('sha256').update(ip + process.env.IP_HASH_SALT).digest('hex') : null,
  });
  if (error) console.error('logClick failed', error);
}
