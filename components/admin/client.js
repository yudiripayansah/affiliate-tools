'use client';

// Komponen interaktif admin: tombol submit, konfirmasi hapus, upload gambar, toast.
import { useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { uploadImage } from '@/lib/admin/media-actions';
import { btn } from './ui';

export function SubmitButton({ children, pendingText = 'Menyimpan…', className = btn.primary, ...props }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} {...props}>
      {pending ? pendingText : children}
    </button>
  );
}

// Tombol yang membuka <dialog> konfirmasi; "Ya" men-submit form `action`.
export function ConfirmButton({ action, fields = {}, title, message, confirmLabel = 'Hapus', children, className = btn.danger }) {
  const ref = useRef(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>{children}</button>
      <dialog ref={ref} className="m-auto w-[min(92vw,26rem)] rounded-xl border border-line bg-surface p-6 text-ink backdrop:bg-black/40">
        <h2 className="font-semibold">{title}</h2>
        {message && <p className="mt-2 text-sm text-muted">{message}</p>}
        <form action={action} className="mt-6 flex justify-end gap-2">
          {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <button type="button" className={btn.secondary} onClick={() => ref.current?.close()}>Batal</button>
          <SubmitButton className={btn.danger.replace('border-discount/40', 'border-transparent bg-discount text-white hover:bg-discount')} pendingText="Menghapus…">
            {confirmLabel}
          </SubmitButton>
        </form>
      </dialog>
    </>
  );
}

// Upload 1 gambar -> simpan URL publiknya di <input type="hidden" name={name}>.
export function ImageField({ name, defaultValue = '', folder = 'products', label = 'Gambar', aspect = 'aspect-square' }) {
  const [url, setUrl] = useState(defaultValue ?? '');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const fileRef = useRef(null);

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    start(async () => {
      const res = await uploadImage(fd);
      if (res.error) setError(res.error);
      else setUrl(res.url);
      if (fileRef.current) fileRef.current.value = '';
    });
  };

  return (
    <div>
      <span className="block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="mt-1.5 flex items-start gap-4">
        <div className={`${aspect} w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-bg`}>
          {/* Preview admin: <img> biasa cukup */}
          {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted">Belum ada</div>}
        </div>
        <div className="space-y-2">
          <label className={`${btn.secondary} cursor-pointer`}>
            {pending ? 'Mengupload…' : url ? 'Ganti gambar' : 'Upload gambar'}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={onPick} disabled={pending} />
          </label>
          {url && <button type="button" className={btn.ghost} onClick={() => setUrl('')}>Hapus gambar</button>}
          <p className="text-xs text-muted">JPG, PNG, WebP, AVIF · maks 5 MB</p>
          {error && <p role="alert" className="text-sm text-discount">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// Toast dari query `?msg=...` (dipasang setelah redirect Server Action), lalu param dibersihkan.
export function Flash() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const msg = params.get('msg');

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      next.delete('msg');
      router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    }, 3500);
    return () => clearTimeout(t);
  }, [msg, params, pathname, router]);

  if (!msg) return null;
  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2.5 text-sm text-bg shadow-lg">
      {msg}
    </div>
  );
}

// Form aksi massal: minta konfirmasi sebelum aksi yang menghapus data.
export function BulkForm({ action, children, ...props }) {
  const onSubmit = (e) => {
    const fd = new FormData(e.currentTarget);
    const n = document.querySelectorAll(`input[name="ids"][form="${props.id}"]:checked`).length;
    if (!n) {
      e.preventDefault();
      alert('Pilih minimal 1 produk dulu.');
    } else if (fd.get('op') === 'delete' && !confirm(`Hapus permanen ${n} produk? Riwayat kliknya ikut terhapus dan tidak bisa dibatalkan.`)) {
      e.preventDefault();
    }
  };
  return <form action={action} onSubmit={onSubmit} {...props}>{children}</form>;
}
