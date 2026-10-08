'use client';

// Carousel horizontal (scroll-snap). Tombol ‹ › di desktop; di mobile cukup digeser.
import { useRef } from 'react';
import Link from 'next/link';

export default function Rail({ title, href, linkLabel = 'Lihat semua', children, actions }) {
  const track = useRef(null);
  const scroll = (dir) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * (el.clientWidth + 12), behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 md:px-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
        <div className="flex items-center gap-2">
          {href && <Link href={href} className="text-sm font-bold text-brand hover:text-brand-hover">{linkLabel}</Link>}
          <button type="button" onClick={() => scroll(-1)} aria-label={`Geser ${title} ke kiri`} className="hidden size-9 items-center justify-center rounded-full border border-line bg-surface hover:border-ink md:flex">‹</button>
          <button type="button" onClick={() => scroll(1)} aria-label={`Geser ${title} ke kanan`} className="hidden size-9 items-center justify-center rounded-full border border-line bg-surface hover:border-ink md:flex">›</button>
        </div>
      </div>
      {actions}
      <ul ref={track} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 md:mx-0 md:scroll-px-0 md:px-0">
        {children}
      </ul>
    </section>
  );
}
