'use server';

import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { db, TAGS } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin/auth';
import { PAGE_SLUGS } from '@/lib/admin/pages';
import { text } from '@/lib/admin/form';

export async function savePage(_prev, fd) {
  await requireAdmin();
  const slug = text(fd, 'slug');
  const values = { title: text(fd, 'title'), body_md: String(fd.get('body_md') ?? '') };
  if (!PAGE_SLUGS.includes(slug)) return { errors: { form: 'Halaman tidak dikenal.' }, values };
  if (!values.title) return { errors: { title: 'Judul wajib diisi.' }, values };
  if (values.body_md.length > 50_000) return { errors: { body_md: 'Isi terlalu panjang (maks 50.000 karakter).' }, values };

  const { error } = await db.from('pages').update(values).eq('slug', slug);
  if (error) return { errors: { form: 'Gagal menyimpan. Coba lagi.' }, values };

  updateTag(TAGS.pages);
  redirect(`/admin/pages?msg=${encodeURIComponent(`Halaman "${values.title}" tersimpan`)}`);
}
