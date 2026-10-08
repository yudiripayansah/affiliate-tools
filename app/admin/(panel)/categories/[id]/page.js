import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCategory } from '@/lib/admin/categories';
import CategoryForm from '@/components/admin/CategoryForm';
import { PageHeader, TableSkeleton } from '@/components/admin/ui';

export const metadata = { title: 'Edit kategori' };

async function EditCategory({ params }) {
  const { id } = await params;
  const category = /^[0-9a-f-]{36}$/.test(id) ? await getCategory(id) : null;
  if (!category) notFound();
  return (
    <>
      <PageHeader title={`Edit: ${category.name}`} />
      <CategoryForm category={category} />
    </>
  );
}

export default function EditCategoryPage({ params }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Suspense fallback={<TableSkeleton rows={3} />}>
        <EditCategory params={params} />
      </Suspense>
    </div>
  );
}
