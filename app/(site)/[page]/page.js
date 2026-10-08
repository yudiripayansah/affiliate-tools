import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/catalog';
import { renderMarkdown } from '@/lib/markdown';
import { longDate } from '@/components/site/format';

const SLUGS = ['tentang', 'disclosure', 'privasi', 'kontak'];

// Prerender slug yang sudah ada supaya <title>/meta/OG berada di <head> (crawler & preview link
// WhatsApp/Facebook tidak menjalankan JS). Slug baru: shell dulu, lalu di-upgrade setelah kunjungan pertama.
export function generateStaticParams() {
  return SLUGS.map((page) => ({ page }));
}

export async function generateMetadata({ params }) {
  const { page } = await params;
  const p = SLUGS.includes(page) ? await getPage(page) : null;
  return p ? { title: p.title, alternates: { canonical: `/${page}` }, openGraph: { title: `${p.title} | Fauqa`, siteName: 'Fauqa', locale: 'id_ID', type: 'website' } } : { title: 'Halaman tidak ditemukan', robots: { index: false } };
}

async function PageContent({ params }) {
  const { page } = await params;
  const p = SLUGS.includes(page) ? await getPage(page) : null;
  if (!p) notFound();

  return (
    <>
      <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{p.title}</h1>
      <p className="mt-3 text-sm text-muted">Diperbarui {longDate(p.updated_at)}</p>
      {/* HTML aman: lib/markdown meng-escape HTML mentah & memfilter link */}
      <div className="prose-fauqa mt-10 text-[1.05rem]" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body_md) }} />
    </>
  );
}

export default function StaticPage({ params }) {
  return (
    <article className="mx-auto mt-6 max-w-3xl rounded-2xl bg-surface px-5 py-10 md:px-12">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" aria-busy="true" />}>
        <PageContent params={params} />
      </Suspense>
    </article>
  );
}
