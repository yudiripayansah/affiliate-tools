// Bagian DB dari import/export CSV (logika murni ada di lib/admin/csv.js).
import { db } from '@/lib/supabase';

const CHUNK = 1000; // batas default baris per request PostgREST

async function fetchAll(build) {
  const all = [];
  for (let from = 0; ; from += CHUNK) {
    const { data, error } = await build().range(from, from + CHUNK - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < CHUNK) return all;
  }
}

export async function loadImportContext() {
  const [cats, prods] = await Promise.all([
    db.from('categories').select('id, slug'),
    fetchAll(() => db.from('products').select('id, slug, images:product_images(url, alt, sort_order)').order('slug')),
  ]);
  if (cats.error) throw cats.error;
  return {
    categories: new Map(cats.data.map((c) => [c.slug, c.id])),
    existing: new Map(prods.map((p) => [p.slug, { id: p.id, images: [...p.images].sort((a, b) => a.sort_order - b.sort_order).map(({ url, alt }) => ({ url, alt })) }])),
  };
}

export const exportProducts = () =>
  fetchAll(() =>
    db.from('products')
      .select('slug, name, brand, description, is_active, is_featured, badge, sort_order, highlights, pros, cons, specs, category:categories(slug), images:product_images(url, sort_order), links:product_links(marketplace, url, price, original_price)')
      .order('created_at'),
  );
