'use server';

import { randomUUID } from 'node:crypto';
import { db } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin/auth';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
const MAX_BYTES = 5 * 1024 * 1024;
const FOLDERS = ['products', 'categories', 'banners'];

// Upload 1 gambar ke bucket `media`, kembalikan URL publiknya.
export async function uploadImage(formData) {
  await requireAdmin();
  const file = formData.get('file');
  const folder = FOLDERS.includes(formData.get('folder')) ? formData.get('folder') : 'products';

  if (!(file instanceof File) || file.size === 0) return { error: 'Pilih file gambar.' };
  if (!TYPES[file.type]) return { error: 'Format harus JPG, PNG, WebP, atau AVIF.' };
  if (file.size > MAX_BYTES) return { error: 'Ukuran maksimal 5 MB.' };

  const path = `${folder}/${randomUUID()}.${TYPES[file.type]}`;
  const { error } = await db.storage.from('media').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) return { error: 'Upload gagal. Coba lagi.' };

  return { url: db.storage.from('media').getPublicUrl(path).data.publicUrl };
}
