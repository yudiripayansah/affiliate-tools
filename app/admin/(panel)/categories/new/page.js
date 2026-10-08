import CategoryForm from '@/components/admin/CategoryForm';
import { PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Tambah kategori' };

export default function NewCategoryPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Tambah kategori" />
      <CategoryForm />
    </div>
  );
}
