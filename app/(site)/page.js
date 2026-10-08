import Link from 'next/link';
import { getActiveBanners, getCategories, getHomeSections } from '@/lib/catalog';
import ProductCard from '@/components/site/ProductCard';
import Rail from '@/components/site/Rail';
import EditorPicks from '@/components/site/EditorPicks';
import BannerCarousel from '@/components/site/BannerCarousel';
import CategoryIcon from '@/components/site/CategoryIcon';
import Img from '@/components/site/Img';

const MARKETS = [
  { key: 'shopee', name: 'Shopee', dot: 'bg-shopee' },
  { key: 'tokopedia', name: 'Tokopedia', dot: 'bg-tokopedia' },
  { key: 'tiktok', name: 'TikTok Shop', dot: 'bg-tiktok' },
];
const TRUST = [
  ['Toko resmi terkurasi', 'Hanya official store & penjual berating tinggi.'],
  ['Harga dibandingkan', 'Lihat marketplace mana yang paling murah.'],
  ['Beli di marketplace resmi', 'Transaksi, garansi, dan pengiriman tetap di Shopee, Tokopedia, atau TikTok Shop.'],
  ['Tanpa biaya tambahan', 'Harga yang kamu bayar sama persis dengan di marketplace.'],
];

// Hero: carousel banner `hero` + 2 banner `side`. Tanpa banner -> hero teks (fallback).
function Hero({ hero, side }) {
  if (!hero.length) {
    return (
      <section className="mx-auto mt-4 max-w-7xl px-4 md:px-6">
        <div className="rounded-2xl bg-brand px-6 py-12 text-white md:px-12 md:py-16">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">Belanja yang sudah disaring.</h1>
          <p className="mt-4 max-w-xl text-white md:text-lg">Produk pilihan dari toko resmi di Shopee, Tokopedia, dan TikTok Shop, lengkap dengan perbandingan harga.</p>
          <form action="/cari" role="search" className="mt-8 flex max-w-xl gap-2">
            <label htmlFor="hero-search" className="sr-only">Cari produk</label>
            <input id="hero-search" name="q" type="search" placeholder="Mau cari apa hari ini?" className="h-12 min-w-0 flex-1 rounded-full bg-white px-5 text-ink placeholder:text-muted" />
            <button className="h-12 rounded-full bg-ink px-6 font-bold">Cari</button>
          </form>
        </div>
      </section>
    );
  }
  return (
    <section className="mx-auto mt-4 grid max-w-7xl gap-3 px-4 md:grid-cols-3 md:px-6">
      <h1 className="sr-only">Fauqa — rekomendasi produk pilihan dengan perbandingan harga</h1>
      <BannerCarousel banners={hero} className={side.length ? 'md:col-span-2 md:aspect-[8/3]' : 'md:col-span-3 md:aspect-[4/1]'} />
      {side.length > 0 && (
        <div className="grid gap-3">
          {side.map((b) => (
            <Link key={b.id} href={b.href} className="relative aspect-[8/3] overflow-hidden rounded-2xl bg-surface md:aspect-auto">
              <Img src={b.image_desktop} alt={b.title} sizes="(min-width: 768px) 33vw, 100vw" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function HomePage() {
  const [{ hero, side }, categories, home] = await Promise.all([getActiveBanners(), getCategories(), getHomeSections()]);
  const shownCategories = categories.filter((c) => c.count > 0);
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fauqa',
    url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    description: 'Kurator rekomendasi produk dari Shopee, Tokopedia, dan TikTok Shop.',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, '\\u003c') }} />
      <Hero hero={hero} side={side} />

      {shownCategories.length > 0 && (
        <section className="mx-auto mt-10 max-w-7xl px-4 md:px-6" aria-labelledby="kategori">
          <h2 id="kategori" className="sr-only">Kategori</h2>
          <ul className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-8 md:px-0">
            {shownCategories.map((c, i) => (
              <li key={c.slug} className="w-20 shrink-0 md:w-auto">
                <Link href={`/c/${c.slug}`} className="group flex flex-col items-center gap-2 text-center">
                  {c.image_url ? (
                    <span className="relative size-16 overflow-hidden rounded-full bg-surface md:size-20"><Img src={c.image_url} alt="" sizes="80px" /></span>
                  ) : (
                    <CategoryIcon slug={c.slug} name={c.name} index={i} className="size-16 transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none md:size-20" />
                  )}
                  <span className="text-xs font-semibold leading-tight group-hover:text-brand md:text-sm">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {home.featured.length > 0 && <EditorPicks products={home.featured} categories={home.featuredCategories} />}

      {home.promo.length > 0 && (
        <Rail title="Lagi Diskon" href="/promo" linkLabel="Semua promo">
          {home.promo.map((p, i) => <ProductCard key={p.slug} product={p} priority={!hero.length && i < 2} />)}
        </Rail>
      )}

      {home.rails.map((r) => (
        <Rail key={r.category.slug} title={r.category.name} href={`/c/${r.category.slug}`}>
          {r.items.map((p) => <ProductCard key={p.slug} product={p} />)}
        </Rail>
      ))}

      {!home.featured.length && !home.promo.length && !home.rails.length && home.latest.length > 0 && (
        <Rail title="Baru masuk">
          {home.latest.map((p) => <ProductCard key={p.slug} product={p} />)}
        </Rail>
      )}

      <section className="mx-auto mt-14 max-w-7xl px-4 md:px-6">
        <h2 className="text-xl font-bold md:text-2xl">Belanja di marketplace favoritmu</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {MARKETS.map((m) => (
            <li key={m.key}>
              <Link href={`/promo?m=${m.key}`} className="flex items-center justify-between rounded-xl bg-surface p-5 hover:ring-1 hover:ring-ink">
                <span className="flex items-center gap-3 font-bold"><span className={`size-3 rounded-full ${m.dot}`} aria-hidden="true" />{m.name}</span>
                <span className="text-sm font-semibold text-brand">Lihat promo</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-4 md:px-6" aria-labelledby="kenapa">
        <h2 id="kenapa" className="text-xl font-bold md:text-2xl">Kenapa belanja lewat Fauqa?</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(([title, desc]) => (
            <li key={title} className="rounded-xl bg-surface p-5">
              <p className="font-bold">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          <Link href="/tentang" className="font-semibold text-ink underline underline-offset-4">Cara kami memilih produk</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/disclosure" className="font-semibold text-ink underline underline-offset-4">Disclosure affiliate</Link>
        </p>
      </section>
    </>
  );
}
