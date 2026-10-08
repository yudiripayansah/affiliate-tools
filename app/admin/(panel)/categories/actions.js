'use server';

import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { db, TAGS } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin/auth';
import { SLUG_RE, dbErrorMessage, int, isHttpsUrl, optText, slugify, text } from '@/lib/admin/form';

export async function saveCategory(_prev, fd) {
  await requireAdmin();
  const id = text(fd, 'id') || null;
  const values = {
    name: text(fd, 'name'),
    slug: text(fd, 'slug') || slugify(text(fd, 'name')),
    description: optText(fd, 'description'),
    image_url: optText(fd, 'image_url'),
    sort_order: int(fd, 'sort_order'),
  };

  const errors = {};
  if (!values.name) errors.name = 'Nama wajib diisi.';
  if (!SLUG_RE.test(values.slug)) errors.slug = 'Hanya huruf kecil, angka, dan tanda hubung.';
  if (values.image_url && !isHttpsUrl(values.image_url)) errors.image_url = 'URL gambar harus https://';
  if (Object.keys(errors).length) return { errors, values };

  const { error } = id
    ? await db.from('categories').update(values).eq('id', id)
    : await db.from('categories').insert(values);
  if (error) return { errors: { form: dbErrorMessage(error), ...(error.code === '23505' && { slug: 'Slug sudah dipakai.' }) }, values };

  updateTag(TAGS.categories);
  redirect(`/admin/categories?msg=${encodeURIComponent(`Kategori "${values.name}" tersimpan`)}`);
}

export async function deleteCategory(fd) {
  await requireAdmin();
  const id = text(fd, 'id');
  const { count } = await db.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
  if (count) {
    redirect(`/admin/categories?msg=${encodeURIComponent(`Tidak bisa dihapus: masih ada ${count} produk. Pindahkan produknya dulu.`)}`);
  }
  const { error } = await db.from('categories').delete().eq('id', id);
  if (error) redirect(`/admin/categories?msg=${encodeURIComponent('Gagal menghapus kategori.')}`);
  updateTag(TAGS.categories);
  redirect(`/admin/categories?msg=${encodeURIComponent('Kategori dihapus')}`);
}
