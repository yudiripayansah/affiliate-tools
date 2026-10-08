'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Produk' },
  { href: '/admin/categories', label: 'Kategori' },
  { href: '/admin/banners', label: 'Banner' },
  { href: '/admin/pages', label: 'Halaman' },
  { href: '/admin/import', label: 'Import / Export' },
];

export default function AdminNav() {
  // usePathname = data URL -> harus di dalam <Suspense> (cacheComponents). Fallback: nav tanpa penanda aktif.
  return (
    <Suspense fallback={<NavLinks pathname="" />}>
      <ActiveNav />
    </Suspense>
  );
}

function ActiveNav() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }) {
  const isActive = (href) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? 'page' : undefined}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
            isActive(href) ? 'bg-ink text-bg font-medium' : 'text-muted hover:bg-line/60 hover:text-ink'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
