'use client';

// Link keluar ke marketplace lewat /api/outbound (tercatat di DB) + event GA4 bila consent diberikan.
// Tombol hitam + titik warna marketplace (warna penuh Shopee bentrok dengan merah brand).
const DOT = { shopee: 'bg-shopee', tokopedia: 'bg-tokopedia', tiktok: 'bg-white' };

export default function BuyLink({ slug, marketplace, source, className = '', children }) {
  return (
    <a
      href={`/api/outbound?p=${slug}&m=${marketplace}&src=${source}`}
      target="_blank"
      rel="sponsored nofollow noopener"
      onClick={() => window.gtag?.('event', 'affiliate_click', { product_slug: slug, marketplace, source })}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink font-bold text-white hover:bg-black ${className}`}
    >
      <span aria-hidden="true" className={`size-2 rounded-full ${DOT[marketplace]}`} />
      {children}
    </a>
  );
}
