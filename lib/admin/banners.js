// Data banner untuk admin (tanpa cache).
import { connection } from 'next/server';
import { db } from '@/lib/supabase';

export async function listBanners() {
  await connection(); // status tayang bergantung pada waktu request
  const { data, error } = await db.from('banners').select('*').order('sort_order').order('created_at', { ascending: false });
  if (error) throw error;
  const now = Date.now();
  return data.map((b) => ({ ...b, status: bannerStatus(b, now) }));
}

export async function getBanner(id) {
  const { data, error } = await db.from('banners').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// Status tayang relatif terhadap `now`.
export function bannerStatus(b, now = Date.now()) {
  if (!b.is_active) return { key: 'off', label: 'Nonaktif' };
  if (b.starts_at && Date.parse(b.starts_at) > now) return { key: 'scheduled', label: 'Terjadwal' };
  if (b.ends_at && Date.parse(b.ends_at) <= now) return { key: 'ended', label: 'Berakhir' };
  return { key: 'live', label: 'Tayang' };
}
