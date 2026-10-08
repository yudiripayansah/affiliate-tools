// Data halaman statis untuk admin (tanpa cache).
import { db } from '@/lib/supabase';

export const PAGE_SLUGS = ['tentang', 'disclosure', 'privasi', 'kontak'];

export async function listPages() {
  const { data, error } = await db.from('pages').select('slug, title, updated_at, body_md');
  if (error) throw error;
  return PAGE_SLUGS.map((s) => data.find((p) => p.slug === s)).filter(Boolean);
}

export async function getPage(slug) {
  if (!PAGE_SLUGS.includes(slug)) return null;
  const { data, error } = await db.from('pages').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}
