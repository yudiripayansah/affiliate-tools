import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryListing, getSitemapEntries } from '@/lib/catalog';
import Listing, { ListingSkeleton, readFilters } from '@/components/site/Listing';
import CategoryIcon from '@/components/site/CategoryIcon';

// Prerender slug yang sudah ada supaya <title>/meta/OG berada di <head> (crawler & preview link
// WhatsApp/Facebook tidak menjalankan JS). Slug baru: shell dulu, lalu di-upgrade setelah kunjungan pertama.
export async function generateStaticParams() {
  const { categories } = await getSitemapEntries();
  return categories.map((c) => ({ slug: c.slug }));
}

// Metadata tidak membaca searchParams (itu akan menundanya keluar dari <head>); canonical = halaman utama kategori.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getCategoryListing(slug);
  if (!data) return { title: 'Kategori tidak ditemukan', robots: { index: false } };
  const description = data.category.description || `Rekomendasi ${data.category.name.toLowerCase()} pilihan Fauqa, lengkap dengan perbandingan harga.`;
  return {
    title: data.category.name,
    description,
    alternates: { canonical: `/c/${slug}` },
    openGraph: { title: `${data.category.name} | Fauqa`, description, siteName: 'Fauqa', locale: 'id_ID', type: 'website' },
  };
}

async function Content({ params, searchParams }) {
  const { slug } = await params;
  const f = readFilters(await searchParams);
  const data = await getCategoryListing(slug, f);
  if (!data) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-ink">Beranda</Link> <span aria-hidden="true">/</span> <span className="text-ink">{data.category.name}</span>
      </nav>
      <header className="mt-4 flex items-center gap-4">
        <CategoryIcon slug={data.category.slug} name={data.category.name} className="size-14 md:size-16" />
        <div>
          <h1 className="text-2xl font-extrabold md:text-4xl">{data.category.name}</h1>
          {data.category.description && <p className="mt-1 text-muted">{data.category.description}</p>}
        </div>
      </header>
      <Listing base={`/c/${slug}`} data={data} filters={f} />
    </>
  );
}

export default function CategoryPage({ params, searchParams }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
      <Suspense fallback={<ListingSkeleton />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
