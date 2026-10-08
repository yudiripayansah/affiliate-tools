'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import { savePage } from '@/app/admin/(panel)/pages/actions';
import { renderMarkdown } from '@/lib/markdown';
import { Card, Field, btn, errProps, inputCls } from './ui';
import { SubmitButton } from './client';

export default function PageForm({ page }) {
  const [state, action] = useActionState(savePage, null);
  const v = state?.values ?? page;
  const e = state?.errors ?? {};
  const [body, setBody] = useState(v.body_md ?? '');
  const html = useMemo(() => renderMarkdown(body), [body]);

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="slug" value={page.slug} />
      {e.form && <p role="alert" className="rounded-lg border border-discount/40 bg-discount/10 px-4 py-3 text-sm text-discount">{e.form}</p>}

      <Card>
        <Field label="Judul halaman" name="title" error={e.title}>
          <input id="title" name="title" defaultValue={v.title} className={inputCls} {...errProps('title', e.title)} />
        </Field>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Isi (Markdown)" description="## Subjudul · **tebal** · _miring_ · - daftar · [teks link](https://…)">
          <label htmlFor="body_md" className="sr-only">Isi halaman</label>
          <textarea
            id="body_md" name="body_md" rows={22} value={body} onChange={(ev) => setBody(ev.target.value)}
            className={`${inputCls} font-mono leading-relaxed`} {...errProps('body_md', e.body_md)}
          />
          {e.body_md && <p id="body_md-error" className="mt-1.5 text-sm text-discount">{e.body_md}</p>}
        </Card>
        <Card title="Pratinjau">
          {/* HTML aman: lib/markdown meng-escape HTML mentah & memfilter link */}
          <div className="prose-fauqa" dangerouslySetInnerHTML={{ __html: html }} />
        </Card>
      </div>

      <div className="flex gap-3">
        <SubmitButton>Simpan halaman</SubmitButton>
        <Link href="/admin/pages" className={btn.secondary}>Batal</Link>
        <Link href={`/${page.slug}`} target="_blank" className={`${btn.ghost} ml-auto`}>Lihat di situs ↗</Link>
      </div>
    </form>
  );
}
