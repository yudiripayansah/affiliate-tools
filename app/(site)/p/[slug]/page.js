import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, getRelated, getSitemapEntries } from '@/lib/catalog';
import Gallery from '@/components/site/Gallery';
import PriceRows from '@/components/site/PriceRows';
import BuyLink from '@/components/site/BuyLink';
import { ProductGrid } from '@/components/site/ProductCard';
import { BADGE_LABEL, MARKET_LABEL, longDate, rupiah } from '@/components/site/format';

// Prerender slug yang sudah ada supaya <title>/meta/OG berada di <head> (crawler & preview link
// WhatsApp/Facebook tidak menjalankan JS). Slug baru: shell dulu, lalu di-upgrade setelah kunjungan pertama.
export async function generateStaticParams() {
  const { products } = await getSitemapEntries();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'Produk tidak ditemukan', robots: { index: false } };
  const description = p.description?.slice(0, 155) || `${p.name} mulai ${rupiah(p.card.price)} di ${MARKET_LABEL[p.card.cheapestMarket]}.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: { title: p.name, description, type: 'website', siteName: 'Fauqa', locale: 'id_ID', images: p.images[0] ? [{ url: p.images[0].url, alt: p.images[0].alt || p.name }] : [] },
  };
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? '';

function JsonLd({ p }) {
  const prices = p.links.map((l) => l.price);
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description || undefined,
      image: p.images.map((i) => i.url),
      offers: { '@type': 'AggregateOffer', priceCurrency: 'IDR', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: `${SITE}/` },
        ...(p.category ? [{ '@type': 'ListItem', position: 2, name: p.category.name, item: `${SITE}/c/${p.category.slug}` }] : []),
        { '@type': 'ListItem', position: p.category ? 3 : 2, name: p.name },
      ],
    },
  ];
  // `<` di-escape agar isi teks tidak bisa menutup tag script.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

async function Related({ categoryId, excludeId, category }) {
  const items = await getRelated(categoryId, excludeId);
  if (!items.length) return null;
  return (
    <section className="mt-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 className="text-xl font-bold md:text-2xl">Lainnya di {category.name}</h2>
        <Link href={`/c/${category.slug}`} className="text-sm font-bold text-brand hover:text-brand-hover">Lihat semua</Link>
      </div>
      <ProductGrid products={items} />
    </section>
  );
}

async function ProductDetail({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const cheapest = p.links.find((l) => l.cheapest) ?? p.links[0];

  return (
    <>
      <JsonLd p={p} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/" className="hover:text-ink">Beranda</Link></li>
          {p.category && <li><span aria-hidden="true">/ </span><Link href={`/c/${p.category.slug}`} className="hover:text-ink">{p.category.name}</Link></li>}
          <li aria-current="page" className="text-ink"><span aria-hidden="true" className="text-muted">/ </span>{p.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2 lg:gap-16">
        <Gallery images={p.images} name={p.name} />

        <div>
          {p.badge && <p className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${p.badge === 'promo' ? 'bg-brand text-white' : p.badge === 'terlaris' ? 'bg-ink text-white' : 'bg-surface ring-1 ring-ink'}`}>{BADGE_LABEL[p.badge]}</p>}
          {p.brand && <p className="mt-3 text-sm font-semibold text-muted">{p.brand}</p>}
          <h1 className="mt-1 text-2xl font-extrabold leading-tight md:text-3xl">{p.name}</h1>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 tabular-nums">
            <span className="text-sm text-muted">{p.links.length > 1 ? 'Mulai' : 'Harga'}</span>
            <span className={`text-3xl font-extrabold ${p.card.discount > 0 ? 'text-brand' : ''}`}>{rupiah(p.card.price)}</span>
            {p.card.original && <s className="text-muted">{rupiah(p.card.original)}</s>}
            {p.card.discount > 0 && <span className="rounded bg-brand-tint px-1.5 py-0.5 text-sm font-bold text-brand-tint-ink">−{p.card.discount}%</span>}
          </p>
          {p.highlights.length > 0 && (
            <ul className="mt-5 space-y-2">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-2.5"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />{h}</li>
              ))}
            </ul>
          )}

          <section aria-labelledby="harga" className="mt-8 rounded-3xl border border-line bg-surface p-5 md:p-6">
            <h2 id="harga" className="font-medium">
              {p.links.length > 1 ? `Bandingkan harga di ${p.links.length} marketplace` : `Tersedia di ${MARKET_LABEL[cheapest.marketplace]}`}
            </h2>
            <div className="mt-2">
              <PriceRows
                links={p.links}
                action={(l) => (
                  <BuyLink slug={p.slug} marketplace={l.marketplace} source="product_page" className="h-10 px-4 text-sm">
                    <span aria-hidden="true">Beli</span><span className="sr-only">Beli di {MARKET_LABEL[l.marketplace]}</span>
                  </BuyLink>
                )}
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Harga dicek {longDate(p.pricesUpdatedAt)} dan bisa berubah sewaktu-waktu di marketplace. Fauqa bisa mendapat komisi dari pembelian lewat link ini.{' '}
              <Link href="/disclosure" className="underline underline-offset-2 hover:text-ink">Selengkapnya</Link>
            </p>
          </section>
        </div>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-12">
          {(p.pros.length > 0 || p.cons.length > 0) && (
            <section className="grid gap-8 sm:grid-cols-2">
              {p.pros.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold md:text-xl">Yang kami suka</h2>
                  <ul className="mt-4 space-y-2.5">{p.pros.map((x) => <li key={x} className="flex gap-2.5"><span aria-hidden="true" className="font-semibold text-tokopedia">+</span>{x}</li>)}</ul>
                </div>
              )}
              {p.cons.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold md:text-xl">Perlu dipertimbangkan</h2>
                  <ul className="mt-4 space-y-2.5">{p.cons.map((x) => <li key={x} className="flex gap-2.5"><span aria-hidden="true" className="font-semibold text-discount">−</span>{x}</li>)}</ul>
                </div>
              )}
            </section>
          )}
          {p.description && (
            <section>
              <h2 className="text-lg font-bold md:text-xl">Tentang produk ini</h2>
              <p className="mt-4 max-w-prose whitespace-pre-line leading-relaxed text-ink/90">{p.description}</p>
            </section>
          )}
        </div>
        {p.specs.length > 0 && (
          <section>
            <h2 className="text-lg font-bold md:text-xl">Spesifikasi</h2>
            <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
              {p.specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[9rem_1fr] gap-4 py-3">
                  <dt className="text-muted">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {p.category && <Related categoryId={p.category_id} excludeId={p.id} category={p.category} />}

      {/* Bar CTA mobile: marketplace termurah selalu terjangkau jempol */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{p.links.length > 1 ? 'Termurah di' : 'Di'} {MARKET_LABEL[cheapest.marketplace]}</p>
          <p className="font-semibold tabular-nums">{rupiah(cheapest.price)}</p>
        </div>
        <BuyLink slug={p.slug} marketplace={cheapest.marketplace} source="sticky_bar" className="h-11 px-5 text-sm">
          Beli di {MARKET_LABEL[cheapest.marketplace]}
        </BuyLink>
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-10 md:grid-cols-2" aria-busy="true">
      <div className="aspect-square rounded-3xl bg-surface" />
      <div className="space-y-4 pt-6">
        <div className="h-10 w-3/4 rounded-lg bg-surface" />
        <div className="h-5 w-1/2 rounded bg-surface" />
        <div className="mt-8 h-56 rounded-3xl bg-surface" />
      </div>
    </div>
  );
}

export default function ProductPage({ params }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-6 md:pb-0">
      <Suspense fallback={<DetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}
