'use client';

// Carousel banner hero (Swiper): loop, autoplay (mati jika prefers-reduced-motion), keyboard, tombol + indikator.
// Swiper membaca waktu saat render, jadi dipasang setelah mount; server merender slide pertama apa adanya.
import { useState } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Autoplay, Keyboard } from 'swiper/modules';
import 'swiper/css';
import Img from './Img';
import { useMounted, useReducedMotion } from './useClient';

function Slide({ b, priority }) {
  return (
    <Link href={b.href} aria-label={b.title} className="relative block aspect-[4/5] w-full md:aspect-auto md:h-full">
      <div className="absolute inset-0 md:hidden"><Img src={b.image_mobile || b.image_desktop} alt={b.title} sizes="calc(100vw - 32px)" priority={priority} /></div>
      <div className="absolute inset-0 hidden md:block"><Img src={b.image_desktop} alt={b.title} sizes="(min-width: 1280px) 840px, 66vw" priority={priority} /></div>
    </Link>
  );
}

export default function BannerCarousel({ banners, className = '' }) {
  const mounted = useMounted();
  const reduce = useReducedMotion();
  const [swiper, setSwiper] = useState(null);
  const [active, setActive] = useState(0);
  const many = banners.length > 1;


  return (
    <section aria-roledescription="carousel" aria-label="Promo utama" className={`relative overflow-hidden rounded-2xl bg-surface ${className}`}>
      {mounted ? (
        <Swiper
          modules={[A11y, Autoplay, Keyboard]}
          onSwiper={setSwiper}
          onSlideChange={(s) => setActive(s.realIndex)}
          loop={many}
          speed={reduce ? 0 : 500}
          autoplay={many && !reduce ? { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
          keyboard={{ enabled: true }}
          a11y={{ enabled: true, slideRole: 'group' }}
          className="h-full"
        >
          {banners.map((b, i) => <SwiperSlide key={b.id} className="md:!h-full"><Slide b={b} priority={i === 0} /></SwiperSlide>)}
        </Swiper>
      ) : (
        <div className="h-full"><Slide b={banners[0]} priority /></div>
      )}
      {many && (
        <>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-2 py-1.5">
            {banners.map((b, i) => (
              <button key={b.id} type="button" onClick={() => swiper?.slideToLoop(i)} aria-label={`Ke promo ${i + 1}`} aria-current={active === i}
                className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${active === i ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />
            ))}
          </div>
          <button type="button" onClick={() => swiper?.slidePrev()} aria-label="Promo sebelumnya" className="absolute left-3 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg md:flex">‹</button>
          <button type="button" onClick={() => swiper?.slideNext()} aria-label="Promo berikutnya" className="absolute right-3 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg md:flex">›</button>
        </>
      )}
    </section>
  );
}
