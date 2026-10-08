import Link from 'next/link';
import { getActiveBanners, getCategories } from '@/lib/catalog';

export function Logo({ className = 'text-[1.6rem]' }) {
  return (
    <span className={`font-extrabold leading-none tracking-tight ${className}`}>
      Fauqa<span className="text-brand">.</span>
    </span>
  );
}

function SearchForm({ id, className = '' }) {
  return (
    <form action="/cari" role="search" className={className}>
      <label htmlFor={id} className="sr-only">Cari produk</label>
      <div className="relative">
        <input id={id} name="q" type="search" placeholder="Cari HP, air fryer, skincare…" className="h-11 w-full rounded-full border border-line bg-bg pl-5 pr-12 text-sm placeholder:text-muted focus:border-ink focus:bg-surface" />
        <button aria-label="Cari" className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4"><path fill="currentColor" d="M8.5 3a5.5 5.5 0 0 1 4.38 8.83l3.65 3.64a.75.75 0 1 1-1.06 1.06l-3.64-3.65A5.5 5.5 0 1 1 8.5 3Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /></svg>
        </button>
      </div>
    </form>
  );
}

export default async function Header() {
  const [categories, { announcement }] = await Promise.all([getCategories(), getActiveBanners()]);
  const shown = categories.filter((c) => c.count > 0);

  return (
    <>
      {announcement && (
        <div className="bg-brand text-white">
          <Link href={announcement.href} className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-center text-[13px] font-semibold hover:underline">
            {announcement.title}{announcement.subtitle && <span className="ml-2 hidden font-medium text-white sm:inline">{announcement.subtitle}</span>}
          </Link>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:gap-8 md:px-6">
          <Link href="/" aria-label="Fauqa — beranda"><Logo /></Link>
          <SearchForm id="site-search" className="hidden flex-1 md:block md:max-w-2xl" />
          <nav aria-label="Utama" className="ml-auto flex items-center gap-5 text-sm font-semibold">
            <Link href="/promo" className="flex items-center gap-1.5 text-brand hover:text-brand-hover">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4"><path fill="currentColor" d="M10.6 1.8c.3 2.4-.9 3.8-2 5.1C7.5 8.2 6.5 9.4 6.6 11.4c.1 2.1 1.6 3.8 3.4 3.8 2 0 3.5-1.5 3.5-3.6 0-.9-.3-1.7-.8-2.4 1.9.8 3.3 2.8 3.3 5.1 0 3.1-2.6 5.7-6 5.7s-6-2.6-6-6c0-5 6.2-6.8 6.6-12.2Z" /></svg>
              Promo
            </Link>
          </nav>
        </div>
        <div className="px-4 pb-3 md:hidden"><SearchForm id="site-search-m" /></div>
        {shown.length > 0 && (
          <nav aria-label="Kategori" className="border-t border-line">
            <div className="no-scrollbar mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 text-sm md:px-6">
              {shown.map((c) => (
                <Link key={c.slug} href={`/c/${c.slug}`} className="whitespace-nowrap border-b-2 border-transparent py-2.5 text-muted hover:border-ink hover:text-ink">{c.name}</Link>
              ))}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
