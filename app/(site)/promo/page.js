import { Suspense } from 'react';
import { getPromoListing } from '@/lib/catalog';
import Listing, { ListingSkeleton, readFilters } from '@/components/site/Listing';
import { MARKET_LABEL } from '@/components/site/format';

export const metadata = {
  title: 'Promo hari ini',
  description: 'Produk pilihan yang sedang diskon di Shopee, Tokopedia, dan TikTok Shop.',
  alternates: { canonical: '/promo' },
};

async function Content({ searchParams }) {
  const f = readFilters(await searchParams, { defaultSort: 'diskon' });
  const data = await getPromoListing(f);
  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold md:text-4xl">Promo{f.market ? ` ${MARKET_LABEL[f.market]}` : ' hari ini'}</h1>
        <p className="mt-1 text-muted">Produk pilihan yang sedang turun harga, diurutkan dari diskon terbesar.</p>
      </header>
      <Listing base="/promo" data={data} filters={f} defaultSort="diskon" hideDiscount emptyText="Belum ada promo untuk filter ini." />
    </>
  );
}

export default function PromoPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
      <Suspense fallback={<ListingSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
