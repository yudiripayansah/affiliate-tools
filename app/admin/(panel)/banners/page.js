import { Suspense } from 'react';
import Link from 'next/link';
import { listBanners } from '@/lib/admin/banners';
import { EmptyState, PageHeader, TableSkeleton, btn } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/client';
import { deleteBanner } from './actions';

export const metadata = { title: 'Banner' };

const PLACEMENT = { hero: 'Hero', side: 'Samping', announcement: 'Pengumuman' };
const STATUS_CLS = { live: 'bg-tokopedia/15', scheduled: 'bg-accent/15', ended: 'bg-line text-muted', off: 'bg-line text-muted' };
const fmt = (iso) => (iso ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(iso)) : null);

async function BannerList() {
  const banners = await listBanners();
  if (!banners.length) {
    return <EmptyState title="Belum ada banner" description="Tanpa banner, homepage menampilkan hero teks bawaan." actionHref="/admin/banners/new" actionLabel="Tambah banner" />;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {banners.map((b) => {
        const s = b.status;
        return (
          <li key={b.id} className="overflow-hidden rounded-xl border border-line bg-surface">
            {b.image_desktop
              ? <img src={b.image_desktop} alt="" className="aspect-[8/3] w-full object-cover" />
              : <div className="flex aspect-[8/3] items-center justify-center bg-brand px-6 text-center text-sm font-semibold text-white">{b.title}</div>}
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/banners/${b.id}`} className="font-medium hover:underline">{b.title}</Link>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_CLS[s.key]}`}>{s.label}</span>
              </div>
              <p className="font-mono text-xs text-muted">{PLACEMENT[b.placement]} · → {b.href}</p>
              <p className="text-xs text-muted">
                {b.starts_at || b.ends_at ? `${fmt(b.starts_at) ?? 'Sekarang'} – ${fmt(b.ends_at) ?? 'tanpa batas'} WIB` : 'Tanpa jadwal'} · urutan {b.sort_order}
              </p>
              <div className="flex gap-1 pt-1">
                <Link href={`/admin/banners/${b.id}`} className={btn.ghost}>Edit</Link>
                <ConfirmButton action={deleteBanner} fields={{ id: b.id }} title={`Hapus banner "${b.title}"?`} message="Tindakan ini tidak bisa dibatalkan." className={btn.ghost}>Hapus</ConfirmButton>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function BannersPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Banner" description="Hero (carousel), 2 banner samping, dan pengumuman di bar merah paling atas." action={<Link href="/admin/banners/new" className={btn.primary}>+ Tambah banner</Link>} />
      <Suspense fallback={<TableSkeleton rows={3} />}>
        <BannerList />
      </Suspense>
    </div>
  );
}
