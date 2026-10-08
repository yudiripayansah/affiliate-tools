import { Suspense } from 'react';
import Link from 'next/link';
import { getCategories, getSearchListing } from '@/lib/catalog';
import Listing, { ListingSkeleton, readFilters } from '@/components/site/Listing';

export const metadata = { title: 'Cari produk', robots: { index: false } };

async function Content({ searchParams }) {
  const f = readFilters(await searchParams);
  const [data, categories] = await Promise.all([getSearchListing(f.q, f), getCategories()]);
  return (
    <>
      <h1 className="text-2xl font-extrabold md:text-4xl">{f.q ? <>Hasil untuk “{f.q}”</> : 'Cari produk'}</h1>
      <form action="/cari" role="search" className="mt-4 flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">Cari produk</label>
        <input id="q" name="q" type="search" defaultValue={f.q} placeholder="Nama produk atau brand" className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-5" />
        <button className="h-11 rounded-full bg-brand px-6 font-bold text-white hover:bg-brand-hover">Cari</button>
      </form>
      {f.q && <Listing base="/cari" data={data} filters={f} emptyText={`Tidak ada produk untuk “${f.q}”. Coba kata lain atau jelajahi kategori di bawah.`} />}
      {(!f.q || !data.total) && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">Jelajahi kategori</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.filter((c) => c.count > 0).map((c) => (
              <li key={c.slug}><Link href={`/c/${c.slug}`} className="block rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:border-ink">{c.name}</Link></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function SearchPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
      <Suspense fallback={<ListingSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
