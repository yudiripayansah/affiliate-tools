'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { saveCategory } from '@/app/admin/(panel)/categories/actions';
import { Card, Field, btn, errProps, inputCls } from './ui';
import { ImageField, SubmitButton } from './client';
import { slugify } from '@/lib/admin/form';


export default function CategoryForm({ category }) {
  const [state, action] = useActionState(saveCategory, null);
  const v = state?.values ?? category ?? {};
  const e = state?.errors ?? {};
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [slug, setSlug] = useState(v.slug ?? '');

  return (
    <form action={action} className="space-y-6" noValidate>
      {category && <input type="hidden" name="id" value={category.id} />}
      {e.form && <p role="alert" className="rounded-lg border border-discount/40 bg-discount/10 px-4 py-3 text-sm text-discount">{e.form}</p>}

      <Card title="Info kategori">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nama" name="name" error={e.name}>
            <input
              id="name" name="name" defaultValue={v.name} required className={inputCls}
              {...errProps('name', e.name)}
              onChange={(ev) => !slugTouched && setSlug(slugify(ev.target.value))}
            />
          </Field>
          <Field label="Slug (URL)" name="slug" error={e.slug} hint={`/c/${slug || 'slug-kategori'}`}>
            <input
              id="slug" name="slug" value={slug} className={inputCls}
              {...errProps('slug', e.slug)}
              onChange={(ev) => { setSlugTouched(true); setSlug(ev.target.value); }}
            />
          </Field>
          <Field label="Deskripsi singkat" name="description" className="md:col-span-2" hint="Tampil di bawah judul halaman kategori.">
            <textarea id="description" name="description" rows={3} defaultValue={v.description ?? ''} className={inputCls} />
          </Field>
          <Field label="Urutan" name="sort_order" hint="Angka kecil tampil lebih dulu.">
            <input id="sort_order" name="sort_order" type="number" defaultValue={v.sort_order ?? 0} className={`${inputCls} max-w-32`} />
          </Field>
        </div>
      </Card>

      <Card title="Gambar">
        <ImageField name="image_url" folder="categories" defaultValue={v.image_url} label="Gambar kategori" />
        {e.image_url && <p className="mt-2 text-sm text-discount">{e.image_url}</p>}
      </Card>

      <div className="flex gap-3">
        <SubmitButton>Simpan kategori</SubmitButton>
        <Link href="/admin/categories" className={btn.secondary}>Batal</Link>
      </div>
    </form>
  );
}
