'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { saveBanner } from '@/app/admin/(panel)/banners/actions';
import { toWibInput } from '@/lib/admin/form';
import { Card, Field, btn, errProps, inputCls } from './ui';
import { ImageField, SubmitButton } from './client';

export default function BannerForm({ banner }) {
  const [state, action] = useActionState(saveBanner, null);
  const e = state?.errors ?? {};
  // Dari state: nilai mentah input; dari DB: konversi ISO -> WIB.
  const v = state?.values ?? { ...banner, starts_at: toWibInput(banner?.starts_at), ends_at: toWibInput(banner?.ends_at) };

  return (
    <form action={action} className="space-y-6" noValidate>
      {banner && <input type="hidden" name="id" value={banner.id} />}
      {e.form && <p role="alert" className="rounded-lg border border-discount/40 bg-discount/10 px-4 py-3 text-sm text-discount">{e.form}</p>}

      <Card title="Konten banner">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Posisi" name="placement" hint="Hero = carousel utama · Samping = 2 banner kecil di kanan hero · Pengumuman = teks di bar merah paling atas." className="md:col-span-2">
            <select id="placement" name="placement" defaultValue={v.placement ?? 'hero'} className={inputCls}>
              <option value="hero">Hero (carousel utama)</option>
              <option value="side">Samping (kanan hero)</option>
              <option value="announcement">Pengumuman (top bar, tanpa gambar)</option>
            </select>
          </Field>
          <Field label="Judul" name="title" error={e.title} hint="Untuk Hero/Samping dipakai sebagai alt text (teks promosi taruh di gambar). Untuk Pengumuman, ini teks yang tampil di bar merah." className="md:col-span-2">
            <input id="title" name="title" defaultValue={v.title} className={inputCls} {...errProps('title', e.title)} />
          </Field>
          <Field label="Subjudul (opsional)" name="subtitle" className="md:col-span-2">
            <input id="subtitle" name="subtitle" defaultValue={v.subtitle ?? ''} className={inputCls} />
          </Field>
          <Field label="Link tujuan" name="href" error={e.href} hint="Path internal (/c/handphone, /p/slug-produk) atau URL https://" className="md:col-span-2">
            <input id="href" name="href" defaultValue={v.href ?? ''} placeholder="/c/handphone" className={inputCls} {...errProps('href', e.href)} />
          </Field>
        </div>
      </Card>

      <Card title="Gambar" description="Hero: 1600×600 px (mobile 800×1000 px). Samping: 800×450 px. Tidak perlu untuk Pengumuman. Jika gambar mobile kosong, gambar desktop dipakai.">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <ImageField name="image_desktop" folder="banners" defaultValue={v.image_desktop} label="Gambar desktop" aspect="aspect-[8/3]" />
            {e.image_desktop && <p className="mt-2 text-sm text-discount">{e.image_desktop}</p>}
          </div>
          <div>
            <ImageField name="image_mobile" folder="banners" defaultValue={v.image_mobile} label="Gambar mobile (opsional)" aspect="aspect-[4/5]" />
            {e.image_mobile && <p className="mt-2 text-sm text-discount">{e.image_mobile}</p>}
          </div>
        </div>
      </Card>

      <Card title="Jadwal & status" description="Waktu dalam WIB. Kosongkan untuk tayang tanpa batas.">
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Mulai tayang" name="starts_at" error={e.starts_at}>
            <input id="starts_at" name="starts_at" type="datetime-local" defaultValue={v.starts_at ?? ''} className={inputCls} {...errProps('starts_at', e.starts_at)} />
          </Field>
          <Field label="Selesai tayang" name="ends_at" error={e.ends_at}>
            <input id="ends_at" name="ends_at" type="datetime-local" defaultValue={v.ends_at ?? ''} className={inputCls} {...errProps('ends_at', e.ends_at)} />
          </Field>
          <Field label="Urutan" name="sort_order" hint="Kecil = tampil lebih dulu.">
            <input id="sort_order" name="sort_order" type="number" defaultValue={v.sort_order ?? 0} className={`${inputCls} max-w-32`} />
          </Field>
          <label className="flex items-center gap-2 text-sm md:col-span-3">
            <input type="checkbox" name="is_active" defaultChecked={v.is_active ?? true} className="size-4 accent-[var(--accent)]" /> Aktif
          </label>
        </div>
      </Card>

      <div className="flex gap-3">
        <SubmitButton>Simpan banner</SubmitButton>
        <Link href="/admin/banners" className={btn.secondary}>Batal</Link>
      </div>
    </form>
  );
}
