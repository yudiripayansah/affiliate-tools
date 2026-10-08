'use server';

import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { db, MARKETPLACES, TAGS } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin/auth';
import { BADGES } from '@/lib/admin/products';
import { SLUG_RE, bool, dbErrorMessage, int, isHttpsUrl, lines, money, optText, slugify, text } from '@/lib/admin/form';

const UUID_RE = /^[0-9a-f-]{36}$/;
const back = (msg, path = '/admin/products') => redirect(`${path}?msg=${encodeURIComponent(msg)}`);

// "Baterai: 30 jam" -> { label: "Baterai", value: "30 jam" }
const parseSpecs = (rows) =>
  rows.map((r) => {
    const i = r.indexOf(':');
    return i > 0 ? { label: r.slice(0, i).trim(), value: r.slice(i + 1).trim() } : null;
  });

export async function saveProduct(_prev, fd) {
  await requireAdmin();
  const id = text(fd, 'id');
  const specRows = lines(fd, 'specs');
  const specs = parseSpecs(specRows);

  let images = [];
  try {
    images = JSON.parse(text(fd, 'images') || '[]').filter((i) => isHttpsUrl(i?.url)).map(({ url, alt }) => ({ url, alt: String(alt ?? '').slice(0, 200) }));
  } catch {}

  const links = MARKETPLACES.map((m) => ({
    marketplace: m,
    url: text(fd, `link_${m}_url`),
    price: money(fd, `link_${m}_price`),
    original_price: money(fd, `link_${m}_original`),
  }));

  const values = {
    id,
    name: text(fd, 'name'),
    brand: text(fd, 'brand').slice(0, 60),
    slug: text(fd, 'slug') || slugify(text(fd, 'name')),
    category_id: text(fd, 'category_id'),
    description: optText(fd, 'description'),
    highlights: lines(fd, 'highlights'),
    pros: lines(fd, 'pros'),
    cons: lines(fd, 'cons'),
    specs: specs.filter(Boolean),
    specsText: text(fd, 'specs'),
    badge: BADGES[text(fd, 'badge')] ? text(fd, 'badge') : '',
    is_featured: bool(fd, 'is_featured'),
    is_active: bool(fd, 'is_active'),
    sort_order: int(fd, 'sort_order'),
    images,
    links,
  };

  const errors = {};
  if (!values.name) errors.name = 'Nama wajib diisi.';
  if (!SLUG_RE.test(values.slug)) errors.slug = 'Hanya huruf kecil, angka, dan tanda hubung.';
  if (values.category_id && !UUID_RE.test(values.category_id)) errors.category_id = 'Kategori tidak valid.';
  if (specs.some((s) => !s)) errors.specs = 'Setiap baris spesifikasi harus berformat "Label: Nilai".';

  const filled = links.filter((l) => l.url || l.price != null || l.original_price != null);
  for (const l of filled) {
    if (!isHttpsUrl(l.url)) errors[`link_${l.marketplace}_url`] = 'URL harus diawali https://';
    if (l.price == null || Number.isNaN(l.price)) errors[`link_${l.marketplace}_price`] = 'Harga wajib diisi (angka ≥ 0).';
    if (Number.isNaN(l.original_price)) errors[`link_${l.marketplace}_original`] = 'Harga coret harus angka.';
    else if (l.original_price != null && l.price != null && l.original_price <= l.price) {
      errors[`link_${l.marketplace}_original`] = 'Harga coret harus lebih besar dari harga.';
    }
  }
  if (!filled.length) errors.links = 'Isi minimal 1 link marketplace.';
  if (Object.keys(errors).length) return { errors, values };

  const { specsText: _, ...payload } = values;
  const { data: savedId, error } = await db.rpc('save_product', { p: { ...payload, links: filled } });
  if (error) {
    return { errors: { form: dbErrorMessage(error), ...(error.code === '23505' && { slug: 'Slug sudah dipakai.' }) }, values };
  }

  updateTag(TAGS.products);
  back(`Produk "${values.name}" tersimpan`, id ? `/admin/products/${savedId}` : '/admin/products');
}

export async function deleteProduct(fd) {
  await requireAdmin();
  const id = text(fd, 'id');
  if (!UUID_RE.test(id)) back('Produk tidak valid');
  const { error } = await db.from('products').delete().eq('id', id);
  if (error) back('Gagal menghapus produk');
  updateTag(TAGS.products);
  back('Produk dihapus');
}

export async function duplicateProduct(fd) {
  await requireAdmin();
  const { data: newId, error } = await db.rpc('duplicate_product', { src: text(fd, 'id') });
  if (error) back('Gagal menduplikat produk');
  updateTag(TAGS.products);
  back('Produk diduplikat (nonaktif). Sesuaikan lalu aktifkan.', `/admin/products/${newId}`);
}

export async function bulkProducts(fd) {
  await requireAdmin();
  const ids = fd.getAll('ids').map(String).filter((i) => UUID_RE.test(i));
  const op = text(fd, 'op');
  if (!ids.length) back('Pilih minimal 1 produk');

  const table = db.from('products');
  const ops = {
    activate: () => table.update({ is_active: true }).in('id', ids),
    deactivate: () => table.update({ is_active: false }).in('id', ids),
    feature: () => table.update({ is_featured: true }).in('id', ids),
    unfeature: () => table.update({ is_featured: false }).in('id', ids),
    category: () => {
      const cat = text(fd, 'bulk_category');
      return table.update({ category_id: UUID_RE.test(cat) ? cat : null }).in('id', ids);
    },
    delete: () => table.delete().in('id', ids),
  };
  if (!ops[op]) back('Aksi tidak dikenal');

  const { error } = await ops[op]();
  if (error) back('Aksi massal gagal');
  updateTag(TAGS.products);
  back(`${ids.length} produk diperbarui`);
}
