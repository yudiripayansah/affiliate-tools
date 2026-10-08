'use client';

// Carousel banner hero: CSS scroll-snap (geser di mobile), tombol + indikator untuk mouse & keyboard.
import { useRef, useState } from 'react';
import Link from 'next/link';
import Img from './Img';

export default function BannerCarousel({ banners, className = '' }) {
  const track = useRef(null);
  const [active, setActive] = useState(0);
  const go = (i) => {
    const el = track.current;
    const n = (i + banners.length) % banners.length;
    el?.scrollTo({ left: n * el.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  return (
    <section aria-roledescription="carousel" aria-label="Promo utama" className={`relative overflow-hidden rounded-2xl bg-surface ${className}`}>
      <div ref={track} onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto">
        {banners.map((b, i) => (
          <Link key={b.id} href={b.href} aria-roledescription="slide" aria-label={`${i + 1} dari ${banners.length}: ${b.title}`}
            className="relative aspect-[4/5] w-full shrink-0 snap-start md:aspect-auto md:h-full">
            <div className="absolute inset-0 md:hidden"><Img src={b.image_mobile || b.image_desktop} alt={b.title} sizes="100vw" priority={i === 0} /></div>
            <div className="absolute inset-0 hidden md:block"><Img src={b.image_desktop} alt={b.title} sizes="(min-width: 1280px) 840px, 66vw" priority={i === 0} /></div>
          </Link>
        ))}
      </div>
      {banners.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-2 py-1.5">
            {banners.map((b, i) => (
              <button key={b.id} type="button" onClick={() => go(i)} aria-label={`Ke promo ${i + 1}`} aria-current={active === i}
                className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${active === i ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />
            ))}
          </div>
          <button type="button" onClick={() => go(active - 1)} aria-label="Promo sebelumnya" className="absolute left-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg md:flex">‹</button>
          <button type="button" onClick={() => go(active + 1)} aria-label="Promo berikutnya" className="absolute right-3 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg md:flex">›</button>
        </>
      )}
    </section>
  );
}
