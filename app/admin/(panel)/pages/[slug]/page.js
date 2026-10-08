import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/admin/pages';
import PageForm from '@/components/admin/PageForm';
import { PageHeader, TableSkeleton } from '@/components/admin/ui';

export const metadata = { title: 'Edit halaman' };

async function EditPage({ params }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <>
      <PageHeader title={`Edit: ${page.title}`} description={`Tampil di /${page.slug}`} />
      <PageForm page={page} />
    </>
  );
}

export default function EditPagePage({ params }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Suspense fallback={<TableSkeleton rows={6} />}>
        <EditPage params={params} />
      </Suspense>
    </div>
  );
}
