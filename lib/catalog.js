// Data storefront (di-cache, diberi tag; admin memanggil updateTag setelah menulis).
// HANYA dari Server Components.
import { cacheLife, cacheTag } from 'next/cache';
import { db, MARKETPLACES, TAGS } from '@/lib/supabase';

export const PAGE_SIZE = 24;
export const SORTS = { populer: 'Populer', termurah: 'Termurah', diskon: 'Diskon terbesar', terbaru: 'Terbaru' };

const CARD_SELECT = 'id, slug, name, brand, badge, is_featured, sort_order, created_at, category:categories(slug, name), images:product_images(url, alt, sort_order), links:product_links(marketplace, price, original_price)';

// Bentuk seragam untuk kartu produk.
export function toCard(p) {
  const links = MARKETPLACES.map((m) => p.links.find((l) => l.marketplace === m)).filter(Boolean)
    .map((l) => ({ marketplace: l.marketplace, price: Number(l.price), original: l.original_price == null ? null : Number(l.original_price) }));
  const cheapest = links.reduce((a, b) => (!a || b.price < a.price ? b : a), null);
  const cover = [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  const discount = cheapest?.original ? Math.round((1 - cheapest.price / cheapest.original) * 100) : 0;
  return {
    id: p.id, slug: p.slug, name: p.name, brand: p.brand, badge: p.badge, category: p.category,
    cover: cover?.url ?? null, coverAlt: cover?.alt || p.name,
    price: cheapest?.price ?? null, original: cheapest?.original ?? null, discount,
    cheapestMarket: cheapest?.marketplace ?? null,
    markets: links.map((l) => l.marketplace),
    createdAt: p.created_at, sortOrder: p.sort_order, isFeatured: p.is_featured,
  };
}

async function activeCards(filter = (q) => q) {
  const { data, error } = await filter(db.from('products').select(CARD_SELECT).eq('is_active', true));
  if (error) throw error;
  return data.map(toCard).filter((c) => c.price != null);
}

export async function getCategories() {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAGS.categories, TAGS.products);
  const { data, error } = await db
    .from('categories')
    .select('slug, name, description, image_url, products(count)')
    .eq('products.is_active', true)
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return data.map(({ products, ...c }) => ({ ...c, count: products[0]?.count ?? 0 }));
}

// Banner aktif dalam periode tayang, dikelompokkan per posisi.
export async function getActiveBanners() {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAGS.banners);
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('banners')
    .select('id, title, subtitle, image_desktop, image_mobile, href, placement')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('sort_order');
  if (error) throw error;
  return {
    hero: data.filter((b) => b.placement === 'hero'),
    side: data.filter((b) => b.placement === 'side').slice(0, 2),
    announcement: data.find((b) => b.placement === 'announcement') ?? null,
  };
}

async function popularity() {
  const { data, error } = await db.rpc('product_popularity', { days: 30 });
  if (error) throw error;
  return new Map(data.map((r) => [r.product_id, Number(r.clicks)]));
}

const byPopularity = (pop) => (a, b) => (pop.get(b.id) ?? 0) - (pop.get(a.id) ?? 0) || b.createdAt.localeCompare(a.createdAt);

export async function getHomeSections() {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAGS.products, TAGS.categories);
  const [cards, pop] = await Promise.all([activeCards(), popularity()]);
  const featured = cards.filter((c) => c.isFeatured).sort((a, b) => a.sortOrder - b.sortOrder);

  // Rail per kategori: kategori dengan >= 4 produk, 10 produk terpopuler.
  const groups = new Map();
  for (const c of cards) {
    if (!c.category) continue;
    if (!groups.has(c.category.slug)) groups.set(c.category.slug, { category: c.category, items: [] });
    groups.get(c.category.slug).items.push(c);
  }
  const rails = [...groups.values()]
    .filter((g) => g.items.length >= 4)
    .map((g) => ({ ...g, items: g.items.sort(byPopularity(pop)).slice(0, 10) }));

  return {
    featured: featured.slice(0, 24),
    featuredCategories: [...new Map(featured.filter((c) => c.category).map((c) => [c.category.slug, c.category])).values()],
    promo: cards.filter((c) => c.discount > 0).sort((a, b) => b.discount - a.discount).slice(0, 12),
    latest: [...cards].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12),
    rails,
  };
}

export const PRICE_BUCKETS = {
  'lt-500rb': { label: 'Di bawah Rp500 rb', min: 0, max: 500_000 },
  '500rb-2jt': { label: 'Rp500 rb – Rp2 jt', min: 500_000, max: 2_000_000 },
  '2jt-5jt': { label: 'Rp2 jt – Rp5 jt', min: 2_000_000, max: 5_000_000 },
  'gt-5jt': { label: 'Di atas Rp5 jt', min: 5_000_000, max: Infinity },
};

// Filter + urutan + pagination yang sama untuk /c/[slug], /promo, dan /cari.
function applyListing(cards, { sort = 'populer', market = '', price = '', discountOnly = false, page = 1 }, pop) {
  let items = cards;
  if (MARKETPLACES.includes(market)) items = items.filter((c) => c.markets.includes(market));
  const bucket = PRICE_BUCKETS[price];
  if (bucket) items = items.filter((c) => c.price >= bucket.min && c.price < bucket.max);
  if (discountOnly) items = items.filter((c) => c.discount > 0);

  items = [...items];
  if (sort === 'termurah') items.sort((a, b) => a.price - b.price);
  else if (sort === 'diskon') items.sort((a, b) => b.discount - a.discount);
  else if (sort === 'terbaru') items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  else items.sort(byPopularity(pop));

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  return { total: items.length, pages, page: current, items: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) };
}

// ponytail: filter/sort/paginate di memori — cukup untuk ≤1.000 produk aktif; pindah ke SQL bila katalog jauh lebih besar.
export async function getCategoryListing(slug, opts = {}) {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAGS.products, TAGS.categories);
  const { data: category, error } = await db.from('categories').select('id, slug, name, description').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (!category) return null;
  const [cards, pop] = await Promise.all([activeCards((q) => q.eq('category_id', category.id)), popularity()]);
  return { category, ...applyListing(cards, opts, pop) };
}

// /promo: semua produk berdiskon lintas kategori.
export async function getPromoListing(opts = {}) {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAGS.products);
  const [cards, pop] = await Promise.all([activeCards(), popularity()]);
  return applyListing(cards, { sort: 'diskon', ...opts, discountOnly: true }, pop);
}

export async function getSearchListing(q, opts = {}) {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAGS.products);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5).map((w) => w.replace(/[%_,()]/g, ''));
  if (!words.length) return { total: 0, pages: 1, page: 1, items: [] };
  const [cards, pop] = await Promise.all([
    activeCards((query) => words.reduce((acc, w) => acc.or(`name.ilike.%${w}%,brand.ilike.%${w}%`), query).limit(200)),
    popularity(),
  ]);
  return applyListing(cards, opts, pop);
}

export async function getProduct(slug) {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAGS.products, TAGS.categories);
  const { data, error } = await db
    .from('products')
    .select('*, category:categories(slug, name), images:product_images(url, alt, sort_order), links:product_links(marketplace, price, original_price, updated_at)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const links = MARKETPLACES.map((m) => data.links.find((l) => l.marketplace === m)).filter(Boolean)
    .map((l) => ({ marketplace: l.marketplace, price: Number(l.price), original: l.original_price == null ? null : Number(l.original_price), updatedAt: l.updated_at }));
  const minPrice = Math.min(...links.map((l) => l.price));
  return {
    ...data,
    images: [...data.images].sort((a, b) => a.sort_order - b.sort_order),
    links: links.map((l) => ({ ...l, cheapest: l.price === minPrice, discount: l.original ? Math.round((1 - l.price / l.original) * 100) : 0 })),
    card: toCard(data),
    pricesUpdatedAt: links.reduce((max, l) => (l.updatedAt > max ? l.updatedAt : max), data.updated_at),
  };
}

export async function getRelated(categoryId, excludeId, limit = 4) {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAGS.products);
  if (!categoryId) return [];
  const cards = await activeCards((q) => q.eq('category_id', categoryId).neq('id', excludeId).limit(limit * 3));
  return cards.slice(0, limit);
}

export async function getPage(slug) {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAGS.pages);
  const { data, error } = await db.from('pages').select('slug, title, body_md, updated_at').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSitemapEntries() {
  'use cache';
  cacheLife('hours');
  cacheTag(TAGS.products, TAGS.categories, TAGS.pages);
  const [products, categories, pages] = await Promise.all([
    db.from('products').select('slug, updated_at').eq('is_active', true),
    db.from('categories').select('slug, products!inner(id)').eq('products.is_active', true), // hanya kategori berisi produk aktif
    db.from('pages').select('slug, updated_at'),
  ]);
  for (const r of [products, categories, pages]) if (r.error) throw r.error;
  return { products: products.data, categories: [...new Set(categories.data.map((c) => c.slug))].map((slug) => ({ slug })), pages: pages.data };
}
