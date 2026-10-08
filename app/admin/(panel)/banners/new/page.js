import BannerForm from '@/components/admin/BannerForm';
import { PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'Tambah banner' };

export default function NewBannerPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Tambah banner" />
      <BannerForm />
    </div>
  );
}
