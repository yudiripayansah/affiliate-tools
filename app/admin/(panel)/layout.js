import { Suspense } from 'react';
import Link from 'next/link';
import { Flash } from '@/components/admin/client';
import AdminNav from '@/components/admin/AdminNav';
import { logout } from '../auth-actions';

export const metadata = { title: { default: 'Admin', template: '%s · Admin Fauqa' }, robots: { index: false } };

export default function AdminPanelLayout({ children }) {
  return (
    <div className="min-h-dvh md:flex">
      <aside className="border-b border-line bg-surface md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-6">
          <Link href="/admin" className="text-xl font-extrabold leading-none tracking-tight">
            Fauqa <span className="font-sans text-xs text-muted">admin</span>
          </Link>
          <form action={logout} className="md:hidden">
            <button className="text-sm text-muted hover:text-ink">Keluar</button>
          </form>
        </div>
        <div className="px-2 pb-3 md:flex-1 md:px-3">
          <AdminNav />
        </div>
        <div className="hidden border-t border-line p-3 md:block">
          <Link href="/" className="block rounded-lg px-3 py-2 text-sm text-muted hover:text-ink">Lihat situs ↗</Link>
          <form action={logout}>
            <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:text-ink">Keluar</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      <Suspense>
        <Flash />
      </Suspense>
    </div>
  );
}
