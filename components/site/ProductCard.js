import Link from 'next/link';
import Img from './Img';
import { BADGE_LABEL, MARKET_LABEL, rupiah } from './format';

const DOT = { shopee: 'bg-shopee', tokopedia: 'bg-tokopedia', tiktok: 'bg-tiktok' };
const BADGE_CLS = {
  promo: 'bg-brand text-white',
  terlaris: 'bg-ink text-white',
  pilihan_editor: 'bg-surface text-ink ring-1 ring-ink',
  baru: 'bg-surface text-ink ring-1 ring-line',
};

// `heading`: level judul kartu mengikuti struktur halaman (h2 bila langsung di bawah h1, h3 di bawah section h2).
export default function ProductCard({ product: p, priority = false, heading: H = 'h3' }) {
  return (
    <Link href={`/p/${p.slug}`} className="group flex h-full flex-col rounded-xl border border-transparent bg-surface p-3 transition-colors hover:border-line motion-reduce:transition-none">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
        <Img src={p.cover} alt={p.coverAlt} priority={priority} fit="contain" />
        {p.badge && <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${BADGE_CLS[p.badge]}`}>{BADGE_LABEL[p.badge]}</span>}
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        {p.brand && <p className="text-xs font-semibold text-muted">{p.brand}</p>}
        <H className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug">{p.name}</H>
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 tabular-nums">
          <span className={`text-base font-bold ${p.discount > 0 ? 'text-brand' : ''}`}>{rupiah(p.price)}</span>
          {p.discount > 0 && <span className="rounded bg-brand-tint px-1 py-px text-[11px] font-bold text-brand-tint-ink">−{p.discount}%</span>}
        </p>
        {p.original && <s className="text-xs text-muted tabular-nums">{rupiah(p.original)}</s>}
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <span className="flex gap-1" aria-hidden="true">
            {p.markets.map((m) => <span key={m} className={`size-2 rounded-full ${DOT[m]}`} />)}
          </span>
          {p.markets.length > 1 ? `Termurah di ${MARKET_LABEL[p.cheapestMarket]}` : `Di ${MARKET_LABEL[p.cheapestMarket]}`}
        </p>
        <span className="mt-auto pt-3">
          <span className="block rounded-full border border-ink py-1.5 text-center text-xs font-bold group-hover:bg-ink group-hover:text-white">Lihat harga</span>
        </span>
      </div>
    </Link>
  );
}

// Lebar item rail: 2,2 kartu terlihat di mobile, 4,5 di desktop (mengisyaratkan bisa digeser).

export function ProductGrid({ products, priorityFirst = 0, heading }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p, i) => <li key={p.slug}><ProductCard product={p} priority={i < priorityFirst} heading={heading} /></li>)}
    </ul>
  );
}
