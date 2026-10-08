// Tata letak listing bersama untuk /c/[slug], /promo, /cari: filter (sidebar desktop / panel mobile), urutan, grid, pagination.
import Link from 'next/link';
import { PRICE_BUCKETS, SORTS } from '@/lib/catalog';
import { ProductGrid } from './ProductCard';
import SortSelect from './SortSelect';
import { MARKET_LABEL } from './format';

const MARKETS = ['shopee', 'tokopedia', 'tiktok'];
const DOT = { shopee: 'bg-shopee', tokopedia: 'bg-tokopedia', tiktok: 'bg-tiktok' };

// Baca & validasi filter dari searchParams.
export function readFilters(sp, { defaultSort = 'populer' } = {}) {
  return {
    sort: SORTS[sp.sort] ? sp.sort : defaultSort,
    market: MARKETS.includes(sp.m) ? sp.m : '',
    price: PRICE_BUCKETS[sp.harga] ? sp.harga : '',
    discountOnly: sp.diskon === '1',
    page: Math.max(1, Number(sp.page) || 1),
    q: typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : '',
  };
}

function urlFor(base, f, patch, defaultSort) {
  const v = { ...f, ...patch };
  const q = new URLSearchParams();
  if (v.q) q.set('q', v.q);
  if (v.sort !== defaultSort) q.set('sort', v.sort);
  if (v.market) q.set('m', v.market);
  if (v.price) q.set('harga', v.price);
  if (v.discountOnly) q.set('diskon', '1');
  if (v.page > 1) q.set('page', String(v.page));
  return q.size ? `${base}?${q}` : base;
}

function Option({ href, active, children }) {
  return (
    <li>
      <Link href={href} scroll={false} aria-current={active ? 'true' : undefined}
        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${active ? 'bg-ink font-semibold text-white' : 'hover:bg-bg'}`}>
        {children}
      </Link>
    </li>
  );
}

function Filters({ base, f, defaultSort, hideDiscount }) {
  const u = (patch) => urlFor(base, f, { ...patch, page: 1 }, defaultSort);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-bold">Marketplace</h3>
        <ul className="space-y-0.5">
          <Option href={u({ market: '' })} active={!f.market}>Semua</Option>
          {MARKETS.map((m) => (
            <Option key={m} href={u({ market: m })} active={f.market === m}>
              <span className={`size-2.5 rounded-full ${DOT[m]}`} aria-hidden="true" />{MARKET_LABEL[m]}
            </Option>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold">Harga</h3>
        <ul className="space-y-0.5">
          <Option href={u({ price: '' })} active={!f.price}>Semua harga</Option>
          {Object.entries(PRICE_BUCKETS).map(([k, b]) => <Option key={k} href={u({ price: k })} active={f.price === k}>{b.label}</Option>)}
        </ul>
      </div>
      {!hideDiscount && (
        <div>
          <h3 className="mb-2 text-sm font-bold">Penawaran</h3>
          <ul><Option href={u({ discountOnly: !f.discountOnly })} active={f.discountOnly}>Hanya yang diskon</Option></ul>
        </div>
      )}
    </div>
  );
}

export default function Listing({ base, data, filters: f, defaultSort = 'populer', hideDiscount = false, emptyText = 'Belum ada produk yang cocok dengan filter ini.' }) {
  const active = [f.market && MARKET_LABEL[f.market], f.price && PRICE_BUCKETS[f.price].label, f.discountOnly && 'Diskon'].filter(Boolean);
  const reset = urlFor(base, { ...f, market: '', price: '', discountOnly: false, page: 1 }, {}, defaultSort);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[14rem_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-32 rounded-xl bg-surface p-4">
          <Filters base={base} f={f} defaultSort={defaultSort} hideDiscount={hideDiscount} />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="relative flex flex-wrap items-center gap-3">
          <details className="group lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold">
              Filter{active.length > 0 && <span className="rounded-full bg-brand px-1.5 text-xs text-white">{active.length}</span>}
            </summary>
            <div className="absolute inset-x-0 z-30 mt-2 rounded-xl border border-line bg-surface p-4 shadow-lg">
              <Filters base={base} f={f} defaultSort={defaultSort} hideDiscount={hideDiscount} />
            </div>
          </details>
          <p className="text-sm text-muted tabular-nums" role="status">{data.total} produk</p>
          {active.length > 0 && <Link href={reset} className="text-sm font-semibold text-brand hover:text-brand-hover">Hapus filter</Link>}
          <div className="ml-auto"><SortSelect value={f.sort} /></div>
        </div>

        <div className="mt-4">
          {data.items.length ? <ProductGrid products={data.items} priorityFirst={4} heading="h2" /> : (
            <p className="rounded-xl bg-surface p-8 text-center text-muted">{emptyText}</p>
          )}
        </div>

        {data.pages > 1 && (
          <nav aria-label="Halaman" className="mt-10 flex items-center justify-between gap-4 text-sm">
            {data.page > 1 ? <Link href={urlFor(base, f, { page: data.page - 1 }, defaultSort)} rel="prev" className="rounded-full border border-line bg-surface px-4 py-2 font-semibold hover:border-ink">Sebelumnya</Link> : <span />}
            <span className="text-muted tabular-nums">Halaman {data.page} dari {data.pages}</span>
            {data.page < data.pages ? <Link href={urlFor(base, f, { page: data.page + 1 }, defaultSort)} rel="next" className="rounded-full border border-line bg-surface px-4 py-2 font-semibold hover:border-ink">Berikutnya</Link> : <span />}
          </nav>
        )}
      </div>
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true">
      <div className="h-10 w-64 rounded-lg bg-surface" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => <div key={i} className="aspect-[3/4] rounded-xl bg-surface" />)}
      </div>
    </div>
  );
}
