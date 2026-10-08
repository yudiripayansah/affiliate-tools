import { Suspense } from 'react';
import { categoryOptions } from '@/lib/admin/products';
import ProductForm from '@/components/admin/ProductForm';
import { PageHeader, TableSkeleton } from '@/components/admin/ui';

export const metadata = { title: 'Tambah produk' };

async function NewProduct() {
  return <ProductForm categories={await categoryOptions()} />;
}

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Tambah produk" />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <NewProduct />
      </Suspense>
    </div>
  );
}
