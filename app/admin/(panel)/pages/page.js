import { Suspense } from 'react';
import Link from 'next/link';
import { listPages } from '@/lib/admin/pages';
import { PageHeader, TableSkeleton, btn, td, th } from '@/components/admin/ui';

export const metadata = { title: 'Halaman' };

const fmt = (iso) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(iso));

async function PageTable() {
  const pages = await listPages();
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[32rem] text-sm">
        <thead className="border-b border-line">
          <tr><th className={th}>Halaman</th><th className={th}>URL</th><th className={th}>Diperbarui</th><th className={th}><span className="sr-only">Aksi</span></th></tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.slug} className="border-b border-line last:border-0">
              <td className={td}><Link href={`/admin/pages/${p.slug}`} className="font-medium hover:underline">{p.title}</Link></td>
              <td className={`${td} font-mono text-xs text-muted`}>/{p.slug}</td>
              <td className={`${td} text-muted`}>{fmt(p.updated_at)} WIB</td>
              <td className={`${td} text-right`}><Link href={`/admin/pages/${p.slug}`} className={btn.ghost}>Edit</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PagesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Halaman" description="Halaman statis yang ditautkan dari footer situs." />
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <PageTable />
      </Suspense>
    </div>
  );
}
