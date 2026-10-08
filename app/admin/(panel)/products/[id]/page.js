import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categoryOptions, clickCount, getProduct } from '@/lib/admin/products';
import ProductForm from '@/components/admin/ProductForm';
import { PageHeader, TableSkeleton, btn } from '@/components/admin/ui';
import { ConfirmButton, SubmitButton } from '@/components/admin/client';
import { deleteProduct, duplicateProduct } from '../actions';

export const metadata = { title: 'Edit produk' };

async function EditProduct({ params }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [product, categories, clicks] = await Promise.all([getProduct(id), categoryOptions(), clickCount(id)]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        description={`${clicks} klik tercatat · ${product.is_active ? 'Aktif' : 'Nonaktif'}`}
        action={
          <div className="flex flex-wrap gap-2">
            {product.is_active && <Link href={`/p/${product.slug}`} target="_blank" className={btn.secondary}>Lihat ↗</Link>}
            <form action={duplicateProduct}>
              <input type="hidden" name="id" value={product.id} />
              <SubmitButton className={btn.secondary} pendingText="Menduplikat…">Duplikat</SubmitButton>
            </form>
            <ConfirmButton
              action={deleteProduct}
              fields={{ id: product.id }}
              title={`Hapus "${product.name}"?`}
              message={clicks
                ? `Produk ini punya ${clicks} klik tercatat. Menghapus produk ikut menghapus riwayat kliknya. Pertimbangkan menonaktifkan saja.`
                : 'Gambar, link, dan data produk akan dihapus permanen.'}
            >
              Hapus
            </ConfirmButton>
          </div>
        }
      />
      <ProductForm product={product} categories={categories} />
    </>
  );
}

export default function EditProductPage({ params }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <EditProduct params={params} />
      </Suspense>
    </div>
  );
}
