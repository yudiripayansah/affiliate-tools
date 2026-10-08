'use client';

// Galeri produk: gambar utama + thumbnail; di mobile bisa di-swipe (scroll-snap).
import { useRef, useState } from 'react';
import Img from './Img';

export default function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  const track = useRef(null);
  if (!images.length) return <div className="relative aspect-square overflow-hidden rounded-3xl bg-surface"><Img src={null} alt="" /></div>;

  const show = (i) => {
    setActive(i);
    const el = track.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'auto' });
  };

  return (
    <div className="min-w-0">
      <div
        ref={track}
        onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-white"
        aria-label={`Foto ${name}`}
      >
        {images.map((img, i) => (
          <div key={img.url} className="relative aspect-square w-full shrink-0 snap-start">
            <Img src={img.url} alt={img.alt || `${name} — foto ${i + 1}`} sizes="(min-width: 768px) 50vw, 100vw" priority={i === 0} fit="contain" />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <li key={img.url}>
              <button type="button" onClick={() => show(i)} aria-label={`Lihat foto ${i + 1}`} aria-current={active === i}
                className={`relative block size-16 overflow-hidden rounded-lg border-2 bg-white ${active === i ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                <Img src={img.url} alt="" sizes="64px" fit="contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
