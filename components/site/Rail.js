'use client';

// Rail produk (Swiper). Mobile ±2,2 kartu (ada peek); desktop pas 3/4/5 kartu per layar, tombol ‹ › geser satu halaman.
// Swiper dipasang setelah mount (membaca waktu saat render); sebelum itu server merender daftar statis berukuran sama.
import { Children, useEffect, useState } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard } from 'swiper/modules';
import 'swiper/css';
import { useMounted } from './useClient';

const GAP = 12;
const BREAKPOINTS = {
  0: { slidesPerView: 2.2, slidesPerGroup: 2, slidesOffsetBefore: 16, slidesOffsetAfter: 16 },
  640: { slidesPerView: 3.2, slidesPerGroup: 3, slidesOffsetBefore: 16, slidesOffsetAfter: 16 },
  768: { slidesPerView: 3, slidesPerGroup: 3, slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
  1024: { slidesPerView: 4, slidesPerGroup: 4, slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
  1280: { slidesPerView: 5, slidesPerGroup: 5, slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
};
// Lebar fallback = lebar slide Swiper di tiap breakpoint.
const STATIC_ITEM = 'w-[calc((100%-2*12px)/2.2)] shrink-0 sm:w-[calc((100%-3*12px)/3.2)] md:w-[calc((100%-2*12px)/3)] lg:w-[calc((100%-3*12px)/4)] xl:w-[calc((100%-4*12px)/5)]';

export default function Rail({ title, href, linkLabel = 'Lihat semua', children, actions, resetKey }) {
  const mounted = useMounted();
  const [swiper, setSwiper] = useState(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const items = Children.toArray(children);

  useEffect(() => { swiper?.slideTo(0, 0); }, [resetKey, swiper]);

  const sync = (s) => setEdge({ start: s.isBeginning, end: s.isEnd });
  const btn = 'hidden size-9 items-center justify-center rounded-full border border-line bg-surface hover:border-ink disabled:pointer-events-none disabled:opacity-40 md:flex';

  return (
    <section className="mx-auto mt-12 max-w-7xl px-4 md:px-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
        <div className="flex items-center gap-2">
          {href && <Link href={href} className="text-sm font-bold text-brand hover:text-brand-hover">{linkLabel}</Link>}
          <button type="button" onClick={() => swiper?.slidePrev()} disabled={!swiper || edge.start} aria-label={`Geser ${title} ke kiri`} className={btn}>‹</button>
          <button type="button" onClick={() => swiper?.slideNext()} disabled={!swiper || edge.end} aria-label={`Geser ${title} ke kanan`} className={btn}>›</button>
        </div>
      </div>
      {actions}
      {mounted ? (
        <Swiper
          modules={[A11y, Keyboard]}
          wrapperTag="ul"
          spaceBetween={GAP}
          breakpoints={BREAKPOINTS}
          keyboard={{ enabled: true, onlyInViewport: true }}
          onSwiper={(s) => { setSwiper(s); sync(s); }}
          onSlideChange={sync}
          onReachEnd={sync}
          onReachBeginning={sync}
          onResize={sync}
          onUpdate={sync}
          className="!-mx-4 pb-1 md:!mx-0"
        >
          {items.map((child, i) => <SwiperSlide key={child.key ?? i} tag="li" className="!h-auto">{child}</SwiperSlide>)}
        </Swiper>
      ) : (
        <ul className="no-scrollbar -mx-4 flex gap-3 overflow-hidden px-4 pb-1 md:mx-0 md:px-0">
          {items.map((child, i) => <li key={child.key ?? i} className={STATIC_ITEM}>{child}</li>)}
        </ul>
      )}
    </section>
  );
}
