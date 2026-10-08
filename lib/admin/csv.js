// Logika murni import/export CSV produk (tanpa DB) — dites oleh scripts/check-csv.mjs.
import Papa from 'papaparse';

export const MARKETS = ['shopee', 'tokopedia', 'tiktok'];
export const BADGE_KEYS = ['terlaris', 'promo', 'pilihan_editor', 'baru'];
export const COLUMNS = [
  'slug', 'name', 'brand', 'category_slug', 'description', 'is_active', 'is_featured', 'badge', 'sort_order',
  'highlights', 'pros', 'cons', 'specs', 'images',
  ...MARKETS.flatMap((m) => [`${m}_url`, `${m}_price`, `${m}_original`]),
];
export const MAX_ROWS = 2000;
const SEP = ' | ';
const SLUG_RE = /^[a-z0-9-]{1,100}$/;

// "Rp 249.000" / "249.000" / "249000" / "249000.5" / "249.000,50" -> angka ; kosong -> null ; invalid -> NaN
export function parsePrice(v) {
  const s = String(v ?? '').replace(/rp\.?/i, '').replace(/\s/g, '');
  if (!s) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d+([.,]\d+)?$/.test(s)) return Number(s.replace(',', '.'));
  return NaN;
}

export function parseBool(v, fallback) {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return fallback;
  if (['ya', 'y', 'true', '1', 'aktif', 'yes'].includes(s)) return true;
  if (['tidak', 't', 'false', '0', 'nonaktif', 'no'].includes(s)) return false;
  return undefined;
}

export const splitList = (v) => String(v ?? '').split('|').map((x) => x.trim()).filter(Boolean);

export function parseCsv(text) {
  const { data, errors, meta } = Papa.parse(String(text ?? '').replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  const missing = ['slug', 'name'].filter((c) => !meta.fields?.includes(c));
  return { rows: data, parseErrors: errors.slice(0, 5).map((e) => `Baris ${e.row + 2}: ${e.message}`), missing };
}

/**
 * Ubah 1 baris CSV jadi payload save_product.
 * ctx: { categories: Map<slug,id>, existing: Map<slug,{id, images}> }
 * Return { status: 'new'|'update'|'error', slug, name, errors[], payload? }
 */
export function rowToProduct(row, ctx) {
  const errors = [];
  const slug = String(row.slug ?? '').trim().toLowerCase();
  const name = String(row.name ?? '').trim();
  if (!SLUG_RE.test(slug)) errors.push('slug tidak valid (huruf kecil, angka, tanda hubung)');
  if (!name) errors.push('name wajib diisi');

  const catSlug = String(row.category_slug ?? '').trim().toLowerCase();
  const category_id = catSlug ? ctx.categories.get(catSlug) : '';
  if (catSlug && !category_id) errors.push(`kategori "${catSlug}" tidak ada`);

  const is_active = parseBool(row.is_active, true);
  const is_featured = parseBool(row.is_featured, false);
  if (is_active === undefined) errors.push('is_active harus ya/tidak');
  if (is_featured === undefined) errors.push('is_featured harus ya/tidak');

  const badge = String(row.badge ?? '').trim().toLowerCase();
  if (badge && !BADGE_KEYS.includes(badge)) errors.push(`badge harus salah satu: ${BADGE_KEYS.join(', ')}`);

  const sortRaw = String(row.sort_order ?? '').trim();
  const sort_order = sortRaw ? Number(sortRaw) : 0;
  if (!Number.isInteger(sort_order)) errors.push('sort_order harus bilangan bulat');

  const specs = splitList(row.specs).map((s) => {
    const i = s.indexOf(':');
    return i > 0 ? { label: s.slice(0, i).trim(), value: s.slice(i + 1).trim() } : null;
  });
  if (specs.some((s) => !s)) errors.push('specs harus berformat "Label: Nilai | Label: Nilai"');

  const imageUrls = splitList(row.images);
  if (imageUrls.some((u) => !/^https:\/\/\S+$/.test(u))) errors.push('images harus URL https:// dipisah " | "');

  const links = [];
  for (const m of MARKETS) {
    const url = String(row[`${m}_url`] ?? '').trim();
    const price = parsePrice(row[`${m}_price`]);
    const original = parsePrice(row[`${m}_original`]);
    if (!url && price == null && original == null) continue;
    if (!/^https:\/\/\S+$/.test(url)) errors.push(`${m}_url harus https://`);
    if (price == null || Number.isNaN(price)) errors.push(`${m}_price wajib angka`);
    if (Number.isNaN(original)) errors.push(`${m}_original harus angka`);
    else if (original != null && price != null && original <= price) errors.push(`${m}_original harus > ${m}_price`);
    links.push({ marketplace: m, url, price, original_price: original });
  }
  if (!links.length) errors.push('isi minimal 1 marketplace (url + price)');

  const existing = ctx.existing.get(slug);
  if (errors.length) return { status: 'error', slug, name, errors };

  return {
    status: existing ? 'update' : 'new',
    slug,
    name,
    errors,
    payload: {
      id: existing?.id ?? '',
      slug, name,
      brand: String(row.brand ?? '').trim().slice(0, 60),
      description: String(row.description ?? '').trim(),
      category_id: category_id ?? '',
      highlights: splitList(row.highlights),
      pros: splitList(row.pros),
      cons: splitList(row.cons),
      specs,
      badge,
      is_active, is_featured, sort_order,
      // Kolom images kosong saat update = gambar lama dipertahankan.
      images: imageUrls.length ? imageUrls.map((url) => ({ url, alt: name })) : (existing?.images ?? []),
      links,
    },
  };
}

// Analisis seluruh file; slug duplikat di dalam file ditandai error.
export function analyzeCsv(text, ctx) {
  const { rows, parseErrors, missing } = parseCsv(text);
  if (missing.length) return { fatal: `Kolom wajib tidak ada: ${missing.join(', ')}` };
  if (rows.length > MAX_ROWS) return { fatal: `Maksimal ${MAX_ROWS} baris per import (file berisi ${rows.length}).` };
  if (!rows.length) return { fatal: 'File tidak berisi data.' };

  const seen = new Map();
  const results = rows.map((row, i) => {
    const r = { line: i + 2, ...rowToProduct(row, ctx) };
    if (r.slug && seen.has(r.slug)) {
      return { ...r, status: 'error', payload: undefined, errors: [...r.errors, `slug duplikat dengan baris ${seen.get(r.slug)}`] };
    }
    seen.set(r.slug, r.line);
    return r;
  });
  const count = (s) => results.filter((r) => r.status === s).length;
  return { results, parseErrors, summary: { total: results.length, new: count('new'), update: count('update'), error: count('error') } };
}

// Produk (bentuk getProduct/export query) -> baris CSV.
export function productToRow(p) {
  const link = (m) => p.links.find((l) => l.marketplace === m) ?? {};
  return {
    slug: p.slug, name: p.name, brand: p.brand ?? '', category_slug: p.category?.slug ?? '', description: p.description ?? '',
    is_active: p.is_active ? 'ya' : 'tidak', is_featured: p.is_featured ? 'ya' : 'tidak', badge: p.badge ?? '', sort_order: p.sort_order ?? 0,
    highlights: (p.highlights ?? []).join(SEP), pros: (p.pros ?? []).join(SEP), cons: (p.cons ?? []).join(SEP),
    specs: (p.specs ?? []).map((s) => `${s.label}: ${s.value}`).join(SEP),
    images: [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url).join(SEP),
    ...Object.fromEntries(MARKETS.flatMap((m) => [[`${m}_url`, link(m).url ?? ''], [`${m}_price`, link(m).price ?? ''], [`${m}_original`, link(m).original_price ?? '']])),
  };
}

// BOM supaya Excel membaca UTF-8 dengan benar.
export const toCsv = (rows) => '\uFEFF' + Papa.unparse({ fields: COLUMNS, data: rows.map((r) => COLUMNS.map((c) => r[c] ?? '')) });
