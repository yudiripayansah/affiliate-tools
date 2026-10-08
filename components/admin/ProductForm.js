'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { saveProduct } from '@/app/admin/(panel)/products/actions';
import { slugify } from '@/lib/admin/form';
import { Card, Field, btn, errProps, inputCls } from './ui';
import { SubmitButton } from './client';
import GalleryField from './GalleryField';

const MARKETS = [
  { key: 'shopee', label: 'Shopee', dot: 'bg-shopee' },
  { key: 'tokopedia', label: 'Tokopedia', dot: 'bg-tokopedia' },
  { key: 'tiktok', label: 'TikTok Shop', dot: 'bg-tiktok' },
];
const BADGES = [['', 'Tanpa badge'], ['terlaris', 'Terlaris'], ['promo', 'Promo'], ['pilihan_editor', 'Pilihan Editor'], ['baru', 'Baru']];

export default function ProductForm({ product, categories }) {
  const [state, action] = useActionState(saveProduct, null);
  const v = state?.values ?? product ?? { is_active: true };
  const e = state?.errors ?? {};
  const link = (m) => v.links?.find((l) => l.marketplace === m) ?? {};
  const specsText = v.specsText ?? (v.specs ?? []).map((s) => `${s.label}: ${s.value}`).join('\n');

  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [slug, setSlug] = useState(v.slug ?? '');

  return (
    <form action={action} className="space-y-6" noValidate>
      {product && <input type="hidden" name="id" value={product.id} />}
      {(e.form || Object.keys(e).length > 0) && (
        <p role="alert" className="rounded-lg border border-discount/40 bg-discount/10 px-4 py-3 text-sm text-discount">
          {e.form ?? 'Ada isian yang perlu diperbaiki. Lihat pesan merah di bawah.'}
        </p>
      )}

      <Card title="Info dasar">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nama produk" name="name" error={e.name} className="md:col-span-2">
            <input id="name" name="name" defaultValue={v.name} className={inputCls} {...errProps('name', e.name)}
              onChange={(ev) => !slugTouched && setSlug(slugify(ev.target.value))} />
          </Field>
          <Field label="Slug (URL)" name="slug" error={e.slug} hint={`/p/${slug || 'slug-produk'}`}>
            <input id="slug" name="slug" value={slug} className={inputCls} {...errProps('slug', e.slug)}
              onChange={(ev) => { setSlugTouched(true); setSlug(ev.target.value); }} />
          </Field>
          <Field label="Brand" name="brand" hint="Tampil di atas nama produk, mis. Xiaomi, Panasonic.">
            <input id="brand" name="brand" defaultValue={v.brand ?? ''} className={inputCls} />
          </Field>
          <Field label="Kategori" name="category_id" error={e.category_id}>
            <select id="category_id" name="category_id" defaultValue={v.category_id ?? ''} className={inputCls}>
              <option value="">— Tanpa kategori —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Deskripsi" name="description" className="md:col-span-2">
            <textarea id="description" name="description" rows={5} defaultValue={v.description ?? ''} className={inputCls} />
          </Field>
        </div>
      </Card>

      <Card title="Gambar" description="Gambar pertama dipakai di kartu produk dan sebagai gambar utama.">
        <GalleryField defaultValue={v.images ?? []} />
      </Card>

      <Card title="Marketplace & harga" description="Isi minimal 1 marketplace. Harga coret opsional (harus lebih besar dari harga).">
        {e.links && <p role="alert" className="mb-4 text-sm text-discount">{e.links}</p>}
        <div className="space-y-5">
          {MARKETS.map(({ key, label, dot }) => {
            const l = link(key);
            const f = (s) => `link_${key}_${s}`;
            return (
              <fieldset key={key} className="grid gap-4 rounded-lg border border-line p-4 md:grid-cols-[1fr_10rem_10rem]">
                <legend className="flex items-center gap-2 px-1 text-sm font-semibold"><span className={`size-2.5 rounded-full ${dot}`} />{label}</legend>
                <Field label="Link affiliate" name={f('url')} error={e[f('url')]}>
                  <input id={f('url')} name={f('url')} type="url" inputMode="url" placeholder="https://" defaultValue={l.url ?? ''} className={inputCls} {...errProps(f('url'), e[f('url')])} />
                </Field>
                <Field label="Harga (Rp)" name={f('price')} error={e[f('price')]}>
                  <input id={f('price')} name={f('price')} type="number" min="0" step="1" defaultValue={l.price ?? ''} className={`${inputCls} tabular-nums`} {...errProps(f('price'), e[f('price')])} />
                </Field>
                <Field label="Harga coret (Rp)" name={f('original')} error={e[f('original')]}>
                  <input id={f('original')} name={f('original')} type="number" min="0" step="1" defaultValue={l.original_price ?? ''} className={`${inputCls} tabular-nums`} {...errProps(f('original'), e[f('original')])} />
                </Field>
              </fieldset>
            );
          })}
        </div>
      </Card>

      <Card title="Konten" description="Satu poin per baris.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Highlight" name="highlights" hint="Poin singkat di bawah nama produk." className="md:col-span-2">
            <textarea id="highlights" name="highlights" rows={3} defaultValue={(v.highlights ?? []).join('\n')} className={inputCls} />
          </Field>
          <Field label="Kelebihan" name="pros">
            <textarea id="pros" name="pros" rows={4} defaultValue={(v.pros ?? []).join('\n')} className={inputCls} />
          </Field>
          <Field label="Kekurangan" name="cons">
            <textarea id="cons" name="cons" rows={4} defaultValue={(v.cons ?? []).join('\n')} className={inputCls} />
          </Field>
          <Field label="Spesifikasi" name="specs" error={e.specs} hint='Format per baris: "Label: Nilai", mis. "Baterai: 30 jam".' className="md:col-span-2">
            <textarea id="specs" name="specs" rows={5} defaultValue={specsText} className={`${inputCls} font-mono`} {...errProps('specs', e.specs)} />
          </Field>
        </div>
      </Card>

      <Card title="Kurasi & status">
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Badge" name="badge">
            <select id="badge" name="badge" defaultValue={v.badge ?? ''} className={inputCls}>
              {BADGES.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
            </select>
          </Field>
          <Field label="Urutan" name="sort_order" hint="Untuk urutan Pilihan Editor; kecil = duluan.">
            <input id="sort_order" name="sort_order" type="number" defaultValue={v.sort_order ?? 0} className={`${inputCls} max-w-32`} />
          </Field>
          <div className="space-y-3 pt-7">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" defaultChecked={v.is_featured} className="size-4 accent-[var(--accent)]" /> Tampilkan di Pilihan Editor</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={v.is_active} className="size-4 accent-[var(--accent)]" /> Aktif (tampil di storefront)</label>
          </div>
        </div>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-line bg-bg/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
        <SubmitButton>Simpan produk</SubmitButton>
        <Link href="/admin/products" className={btn.secondary}>Batal</Link>
      </div>
    </form>
  );
}
