'use client';

// Galeri produk (Swiper): geser di mobile, thumbnail + keyboard di desktop.
// Swiper dipasang setelah mount (membaca waktu saat render); server merender foto pertama.
import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard } from 'swiper/modules';
import 'swiper/css';
import { useMounted } from './useClient';
import Img from './Img';

export default function Gallery({ images, name }) {
  const mounted = useMounted();
  const [swiper, setSwiper] = useState(null);
  const [active, setActive] = useState(0);

  if (!images.length) return <div className="relative aspect-square overflow-hidden rounded-3xl bg-surface"><Img src={null} alt="" /></div>;

  const photo = (img, i) => (
    <div className="relative aspect-square w-full">
      <Img src={img.url} alt={img.alt || `${name} — foto ${i + 1}`} sizes="(min-width: 768px) 50vw, 100vw" priority={i === 0} fit="contain" />
    </div>
  );

  return (
    <div className="min-w-0">
      <div className="overflow-hidden rounded-2xl bg-white" aria-label={`Foto ${name}`}>
        {mounted ? (
          <Swiper modules={[A11y, Keyboard]} onSwiper={setSwiper} onSlideChange={(s) => setActive(s.activeIndex)} keyboard={{ enabled: true, onlyInViewport: true }}>
            {images.map((img, i) => <SwiperSlide key={img.url}>{photo(img, i)}</SwiperSlide>)}
          </Swiper>
        ) : photo(images[0], 0)}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <li key={img.url}>
              <button type="button" onClick={() => swiper?.slideTo(i)} aria-label={`Lihat foto ${i + 1}`} aria-current={active === i}
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
