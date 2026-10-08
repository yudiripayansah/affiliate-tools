'use client';

// Galeri produk: upload banyak gambar, atur urutan (pertama = utama), alt text, hapus.
// Nilai dikirim sebagai JSON di <input type="hidden" name="images">.
import { useRef, useState, useTransition } from 'react';
import { uploadImage } from '@/lib/admin/media-actions';
import { btn, inputCls } from './ui';

export default function GalleryField({ defaultValue = [] }) {
  const [images, setImages] = useState(defaultValue.map(({ url, alt }) => ({ url, alt: alt ?? '' })));
  const [errors, setErrors] = useState([]);
  const [pending, start] = useTransition();
  const fileRef = useRef(null);

  const onPick = (e) => {
    const files = [...(e.target.files ?? [])];
    if (!files.length) return;
    setErrors([]);
    start(async () => {
      const results = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('folder', 'products');
          return { name: file.name, ...(await uploadImage(fd)) };
        }),
      );
      setImages((prev) => [...prev, ...results.filter((r) => r.url).map((r) => ({ url: r.url, alt: '' }))]);
      setErrors(results.filter((r) => r.error).map((r) => `${r.name}: ${r.error}`));
      if (fileRef.current) fileRef.current.value = '';
    });
  };

  const move = (i, d) =>
    setImages((prev) => {
      const next = [...prev];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });

  return (
    <div>
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      {images.length > 0 && (
        <ol className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.url} className="rounded-lg border border-line bg-bg p-2">
              <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded bg-ink px-2 py-0.5 text-xs text-bg">Utama</span>}
              </div>
              <label className="sr-only" htmlFor={`alt-${i}`}>Alt text gambar {i + 1}</label>
              <input
                id={`alt-${i}`}
                value={img.alt}
                placeholder="Alt text (deskripsi gambar)"
                onChange={(e) => setImages((prev) => prev.map((p, j) => (j === i ? { ...p, alt: e.target.value } : p)))}
                className={`${inputCls} mt-2`}
              />
              <div className="mt-2 flex justify-between">
                <div className="flex gap-1">
                  <button type="button" className={btn.ghost} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Geser gambar ${i + 1} ke kiri`}>←</button>
                  <button type="button" className={btn.ghost} disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label={`Geser gambar ${i + 1} ke kanan`}>→</button>
                </div>
                <button type="button" className={btn.ghost} onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}>Hapus</button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <label className={`${btn.secondary} cursor-pointer`}>
        {pending ? 'Mengupload…' : '+ Tambah gambar'}
        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={onPick} disabled={pending} />
      </label>
      <p className="mt-2 text-xs text-muted">Bisa pilih beberapa file sekaligus. Gambar pertama jadi gambar utama. Maks 5 MB per file.</p>
      {errors.map((e) => <p key={e} role="alert" className="mt-1 text-sm text-discount">{e}</p>)}
    </div>
  );
}
