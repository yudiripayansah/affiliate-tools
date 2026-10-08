import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getBanner } from '@/lib/admin/banners';
import BannerForm from '@/components/admin/BannerForm';
import { PageHeader, TableSkeleton } from '@/components/admin/ui';

export const metadata = { title: 'Edit banner' };

async function EditBanner({ params }) {
  const { id } = await params;
  const banner = /^[0-9a-f-]{36}$/.test(id) ? await getBanner(id) : null;
  if (!banner) notFound();
  return (
    <>
      <PageHeader title={`Edit: ${banner.title}`} />
      <BannerForm banner={banner} />
    </>
  );
}

export default function EditBannerPage({ params }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <EditBanner params={params} />
      </Suspense>
    </div>
  );
}
