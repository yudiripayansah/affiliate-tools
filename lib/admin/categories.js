// Data kategori untuk admin (tanpa cache: admin selalu lihat data terbaru).
import { db } from '@/lib/supabase';

export async function listCategories() {
  const { data, error } = await db
    .from('categories')
    .select('id, slug, name, description, image_url, sort_order, products(count)')
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return data.map(({ products, ...c }) => ({ ...c, productCount: products[0]?.count ?? 0 }));
}

export async function getCategory(id) {
  const { data, error } = await db.from('categories').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}
