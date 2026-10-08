'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { commitImport, previewImport } from '@/app/admin/(panel)/import/actions';
import { Card, btn, td, th } from './ui';

const STATUS = {
  new: { label: 'Baru', cls: 'bg-tokopedia/15' },
  update: { label: 'Update', cls: 'bg-accent/15' },
  error: { label: 'Error', cls: 'bg-discount/15 text-discount' },
};

export default function ImportPanel() {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [pending, start] = useTransition();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    setPreview(null);
    setResult(null);
    if (!file) return;
    const content = await file.text();
    setText(content);
    setFileName(file.name);
    start(async () => setPreview(await previewImport(content)));
  };

  const onCommit = () => start(async () => setResult(await commitImport(text)));
  const rows = preview?.results?.filter((r) => !onlyErrors || r.status === 'error') ?? [];
  const validCount = preview?.summary ? preview.summary.new + preview.summary.update : 0;

  return (
    <div className="space-y-6">
      <Card title="1. Pilih file CSV" description="Kolom wajib: slug, name, dan minimal 1 marketplace (url + price). Produk dengan slug yang sudah ada akan di-update.">
        <div className="flex flex-wrap items-center gap-3">
          <label className={`${btn.secondary} cursor-pointer`}>
            {fileName ? 'Ganti file' : 'Pilih file .csv'}
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} disabled={pending} />
          </label>
          {fileName && <span className="text-sm text-muted">{fileName}</span>}
          {pending && !preview && <span className="text-sm text-muted">Menganalisis…</span>}
        </div>
      </Card>

      {preview?.fatal && <p role="alert" className="rounded-lg border border-discount/40 bg-discount/10 px-4 py-3 text-sm text-discount">{preview.fatal}</p>}

      {preview?.summary && !result && (
        <Card title="2. Pratinjau">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['Total baris', preview.summary.total], ['Produk baru', preview.summary.new], ['Di-update', preview.summary.update], ['Error (dilewati)', preview.summary.error]].map(([k, val]) => (
              <div key={k} className="rounded-lg border border-line p-3">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="text-2xl font-semibold tabular-nums">{val}</dd>
              </div>
            ))}
          </dl>
          {preview.parseErrors?.length > 0 && <ul className="mt-3 text-sm text-discount">{preview.parseErrors.map((e) => <li key={e}>{e}</li>)}</ul>}

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} className="size-4 accent-[var(--accent)]" /> Tampilkan hanya baris error
          </label>
          <div className="mt-3 max-h-[28rem] overflow-auto rounded-lg border border-line">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="sticky top-0 border-b border-line bg-surface">
                <tr><th className={th}>Baris</th><th className={th}>Slug</th><th className={th}>Status</th><th className={th}>Keterangan</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.line} className="border-b border-line last:border-0">
                    <td className={`${td} tabular-nums text-muted`}>{r.line}</td>
                    <td className={`${td} whitespace-nowrap font-mono text-xs`}>{r.slug || '—'}</td>
                    <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span></td>
                    <td className={`${td} text-xs ${r.errors.length ? 'text-discount' : 'text-muted'}`}>{r.errors.length ? r.errors.join(' · ') : r.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" className={btn.primary} disabled={!validCount || pending} onClick={onCommit}>
              {pending ? 'Mengimport…' : `Import ${validCount} baris valid`}
            </button>
            {preview.summary.error > 0 && <span className="text-sm text-muted">{preview.summary.error} baris error akan dilewati. Perbaiki di file lalu import ulang.</span>}
          </div>
        </Card>
      )}

      {result && (
        <Card title="3. Hasil">
          {result.fatal ? (
            <p role="alert" className="text-sm text-discount">{result.fatal}</p>
          ) : (
            <div role="status" className="space-y-3 text-sm">
              <p><strong className="tabular-nums">{result.saved}</strong> produk tersimpan · <span className="tabular-nums">{result.skipped}</span> baris dilewati karena error validasi.</p>
              {result.failed.length > 0 && (
                <ul className="text-discount">{result.failed.map((f) => <li key={`${f.line}-${f.slug}`}>Baris {f.line} ({f.slug}): {f.error}</li>)}</ul>
              )}
              <div className="flex gap-2">
                <Link href="/admin/products" className={btn.secondary}>Lihat produk</Link>
                <button type="button" className={btn.ghost} onClick={() => { setPreview(null); setResult(null); setFileName(''); setText(''); }}>Import file lain</button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
