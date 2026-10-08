import { Suspense } from 'react';
import Link from 'next/link';
import { listCategories } from '@/lib/admin/categories';
import { EmptyState, PageHeader, TableSkeleton, btn, td, th } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/client';
import { deleteCategory } from './actions';

export const metadata = { title: 'Kategori' };

async function CategoryTable() {
  const categories = await listCategories();
  if (!categories.length) {
    return <EmptyState title="Belum ada kategori" description="Kategori mengelompokkan produk di storefront." actionHref="/admin/categories/new" actionLabel="Tambah kategori" />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="border-b border-line">
          <tr><th className={th}>Kategori</th><th className={th}>Slug</th><th className={`${th} text-right`}>Produk</th><th className={`${th} text-right`}>Urutan</th><th className={th}><span className="sr-only">Aksi</span></th></tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b border-line last:border-0">
              <td className={td}>
                <div className="flex items-center gap-3">
                  <div className="size-10 shrink-0 overflow-hidden rounded-md bg-bg">
                    {c.image_url && <img src={c.image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <Link href={`/admin/categories/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                </div>
              </td>
              <td className={`${td} font-mono text-xs text-muted`}>{c.slug}</td>
              <td className={`${td} text-right tabular-nums`}>{c.productCount}</td>
              <td className={`${td} text-right tabular-nums text-muted`}>{c.sort_order}</td>
              <td className={`${td} text-right`}>
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/categories/${c.id}`} className={btn.ghost}>Edit</Link>
                  <ConfirmButton
                    action={deleteCategory}
                    fields={{ id: c.id }}
                    title={`Hapus kategori "${c.name}"?`}
                    message={c.productCount ? `Kategori ini masih berisi ${c.productCount} produk dan tidak bisa dihapus sebelum produknya dipindah.` : 'Tindakan ini tidak bisa dibatalkan.'}
                    className={btn.ghost}
                  >
                    Hapus
                  </ConfirmButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Kategori"
        description="Kelompokkan produk; urutan menentukan tampilan di storefront."
        action={<Link href="/admin/categories/new" className={btn.primary}>+ Tambah kategori</Link>}
      />
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <CategoryTable />
      </Suspense>
    </div>
  );
}
