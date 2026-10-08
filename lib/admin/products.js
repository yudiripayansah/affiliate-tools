// Data produk untuk admin (tanpa cache).
import { db } from '@/lib/supabase';

export const PAGE_SIZE = 25;
export const BADGES = { terlaris: 'Terlaris', promo: 'Promo', pilihan_editor: 'Pilihan Editor', baru: 'Baru' };
const SORTS = { newest: ['created_at', false], oldest: ['created_at', true], name: ['name', true], updated: ['updated_at', false] };

export async function listProducts({ q = '', category = '', status = '', badge = '', sort = 'newest', page = 1 } = {}) {
  const [col, asc] = SORTS[sort] ?? SORTS.newest;
  const from = (Math.max(1, page) - 1) * PAGE_SIZE;

  let query = db
    .from('products')
    .select('id, slug, name, is_active, is_featured, badge, updated_at, category:categories(id, name), images:product_images(url, sort_order), links:product_links(marketplace, price, original_price)', { count: 'exact' })
    .order(col, { ascending: asc })
    .range(from, from + PAGE_SIZE - 1);

  // ponytail: ilike cukup untuk ≤1.000 produk (ada index trigram); full-text search bila katalog jauh lebih besar
  if (q) query = query.ilike('name', `%${q.replace(/[%_]/g, '\\$&')}%`);
  if (category === 'none') query = query.is('category_id', null);
  else if (category) query = query.eq('category_id', category);
  if (status === 'active') query = query.eq('is_active', true);
  if (status === 'inactive') query = query.eq('is_active', false);
  if (status === 'featured') query = query.eq('is_featured', true);
  if (badge) query = query.eq('badge', badge);

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    total: count ?? 0,
    pages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
    products: data.map(({ images, ...p }) => ({
      ...p,
      cover: [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
      minPrice: p.links.length ? Math.min(...p.links.map((l) => Number(l.price))) : null,
    })),
  };
}

export async function getProduct(id) {
  const { data, error } = await db
    .from('products')
    .select('*, images:product_images(url, alt, sort_order), links:product_links(marketplace, url, price, original_price)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (data) data.images.sort((a, b) => a.sort_order - b.sort_order);
  return data;
}

export async function categoryOptions() {
  const { data, error } = await db.from('categories').select('id, name').order('sort_order').order('name');
  if (error) throw error;
  return data;
}

export async function clickCount(productId) {
  const { count } = await db.from('click_events').select('id', { count: 'exact', head: true }).eq('product_id', productId);
  return count ?? 0;
}
