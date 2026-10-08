'use server';

import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { db, TAGS } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin/auth';
import { bool, dbErrorMessage, int, isHttpsUrl, optText, text, wibDate } from '@/lib/admin/form';

const PLACEMENTS = ['hero', 'side', 'announcement'];

const back = (msg) => redirect(`/admin/banners?msg=${encodeURIComponent(msg)}`);

export async function saveBanner(_prev, fd) {
  await requireAdmin();
  const id = text(fd, 'id') || null;
  const values = {
    title: text(fd, 'title'),
    subtitle: optText(fd, 'subtitle'),
    placement: PLACEMENTS.includes(text(fd, 'placement')) ? text(fd, 'placement') : 'hero',
    image_desktop: optText(fd, 'image_desktop'),
    image_mobile: optText(fd, 'image_mobile'),
    href: text(fd, 'href'),
    starts_at: wibDate(fd, 'starts_at'),
    ends_at: wibDate(fd, 'ends_at'),
    is_active: bool(fd, 'is_active'),
    sort_order: int(fd, 'sort_order'),
  };
  const raw = { ...values, starts_at: text(fd, 'starts_at'), ends_at: text(fd, 'ends_at') };

  const errors = {};
  if (!values.title) errors.title = 'Judul wajib diisi (teks pengumuman / alt text gambar).';
  if (values.placement !== 'announcement' && !isHttpsUrl(values.image_desktop ?? '')) errors.image_desktop = 'Upload gambar (wajib untuk banner hero & samping).';
  if (values.image_mobile && !isHttpsUrl(values.image_mobile)) errors.image_mobile = 'Gambar mobile tidak valid.';
  if (!/^\/[^\s]*$/.test(values.href) && !isHttpsUrl(values.href)) errors.href = 'Isi path internal (mis. /c/handphone) atau URL https://';
  if (Number.isNaN(values.starts_at)) errors.starts_at = 'Tanggal tidak valid.';
  if (Number.isNaN(values.ends_at)) errors.ends_at = 'Tanggal tidak valid.';
  if (!errors.starts_at && !errors.ends_at && values.starts_at && values.ends_at && Date.parse(values.ends_at) <= Date.parse(values.starts_at)) {
    errors.ends_at = 'Selesai harus setelah mulai.';
  }
  if (Object.keys(errors).length) return { errors, values: raw };

  const { error } = id ? await db.from('banners').update(values).eq('id', id) : await db.from('banners').insert(values);
  if (error) return { errors: { form: dbErrorMessage(error) }, values: raw };

  updateTag(TAGS.banners);
  back(`Banner "${values.title}" tersimpan`);
}

export async function deleteBanner(fd) {
  await requireAdmin();
  const { error } = await db.from('banners').delete().eq('id', text(fd, 'id'));
  if (error) back('Gagal menghapus banner');
  updateTag(TAGS.banners);
  back('Banner dihapus');
}
