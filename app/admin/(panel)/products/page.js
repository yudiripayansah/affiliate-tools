import { Suspense } from 'react';
import Link from 'next/link';
import { BADGES, PAGE_SIZE, categoryOptions, listProducts } from '@/lib/admin/products';
import { EmptyState, PageHeader, TableSkeleton, btn, inlineInputCls, inputCls, td, th } from '@/components/admin/ui';
import { BulkForm, SubmitButton } from '@/components/admin/client';
import { bulkProducts } from './actions';

export const metadata = { title: 'Produk' };

const rupiah = (n) => (n == null ? '—' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n));
const DOT = { shopee: 'bg-shopee', tokopedia: 'bg-tokopedia', tiktok: 'bg-tiktok' };

async function ProductTable({ searchParams }) {
  const sp = await searchParams;
  const filters = { q: sp.q ?? '', category: sp.category ?? '', status: sp.status ?? '', badge: sp.badge ?? '', sort: sp.sort ?? 'newest', page: Number(sp.page) || 1 };
  const [{ products, total, pages }, categories] = await Promise.all([listProducts(filters), categoryOptions()]);
  const qs = (patch) => `?${new URLSearchParams(Object.entries({ ...filters, ...patch }).filter(([, v]) => v && v !== 'newest' && v !== 1))}`;
  const hasFilter = filters.q || filters.category || filters.status || filters.badge;

  return (
    <>
      {/* Filter: GET form biasa, state di URL */}
      <form className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_10rem_10rem_10rem_9rem_auto]">
        <label className="sr-only" htmlFor="q">Cari produk</label>
        <input id="q" name="q" type="search" placeholder="Cari nama produk…" defaultValue={filters.q} className={inputCls} />
        <label className="sr-only" htmlFor="f-category">Kategori</label>
        <select id="f-category" name="category" defaultValue={filters.category} className={inputCls}>
          <option value="">Semua kategori</option>
          <option value="none">Tanpa kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-status">Status</label>
        <select id="f-status" name="status" defaultValue={filters.status} className={inputCls}>
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="featured">Pilihan Editor</option>
        </select>
        <label className="sr-only" htmlFor="f-badge">Badge</label>
        <select id="f-badge" name="badge" defaultValue={filters.badge} className={inputCls}>
          <option value="">Semua badge</option>
          {Object.entries(BADGES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-sort">Urutkan</label>
        <select id="f-sort" name="sort" defaultValue={filters.sort} className={inputCls}>
          <option value="newest">Terbaru</option>
          <option value="updated">Baru diubah</option>
          <option value="name">Nama A–Z</option>
          <option value="oldest">Terlama</option>
        </select>
        <div className="flex gap-2">
          <button className={btn.secondary}>Terapkan</button>
          {hasFilter && <Link href="/admin/products" className={btn.ghost}>Reset</Link>}
        </div>
      </form>

      {!products.length ? (
        hasFilter
          ? <EmptyState title="Tidak ada produk yang cocok" description="Coba ubah kata kunci atau filter." />
          : <EmptyState title="Belum ada produk" description="Tambah produk satu per satu atau import dari CSV." actionHref="/admin/products/new" actionLabel="Tambah produk" />
      ) : (
        <>
          {/* Aksi massal: checkbox di tabel memakai atribut form="bulk" */}
          <BulkForm id="bulk" action={bulkProducts} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Dengan yang dipilih:</span>
            <label className="sr-only" htmlFor="op">Aksi massal</label>
            <select id="op" name="op" className={inlineInputCls} defaultValue="activate">
              <option value="activate">Aktifkan</option>
              <option value="deactivate">Nonaktifkan</option>
              <option value="feature">Jadikan Pilihan Editor</option>
              <option value="unfeature">Hapus dari Pilihan Editor</option>
              <option value="category">Pindah kategori →</option>
              <option value="delete">Hapus permanen</option>
            </select>
            <label className="sr-only" htmlFor="bulk_category">Kategori tujuan</label>
            <select id="bulk_category" name="bulk_category" className={inlineInputCls} defaultValue="">
              <option value="">(kategori tujuan)</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <SubmitButton className={btn.secondary} pendingText="Memproses…">Jalankan</SubmitButton>
            <span className="ml-auto text-muted tabular-nums">{total} produk</span>
          </BulkForm>

          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[48rem] text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className={`${th} w-10`}><span className="sr-only">Pilih</span></th>
                  <th className={th}>Produk</th>
                  <th className={th}>Kategori</th>
                  <th className={th}>Marketplace</th>
                  <th className={`${th} text-right`}>Mulai dari</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bg/60">
                    <td className={td}>
                      <input type="checkbox" name="ids" value={p.id} form="bulk" aria-label={`Pilih ${p.name}`} className="size-4 accent-[var(--accent)]" />
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <div className="size-11 shrink-0 overflow-hidden rounded-md bg-bg">
                          {p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-medium hover:underline">{p.name}</Link>
                          <p className="font-mono text-xs text-muted">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${td} text-muted`}>{p.category?.name ?? '—'}</td>
                    <td className={td}>
                      <div className="flex gap-1.5">
                        {p.links.map((l) => <span key={l.marketplace} title={l.marketplace} className={`size-2.5 rounded-full ${DOT[l.marketplace]}`} />)}
                      </div>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{rupiah(p.minPrice)}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${p.is_active ? 'bg-tokopedia/15 text-ink' : 'bg-line text-muted'}`}>{p.is_active ? 'Aktif' : 'Nonaktif'}</span>
                        {p.is_featured && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs">Pilihan Editor</span>}
                        {p.badge && <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">{BADGES[p.badge]}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <nav aria-label="Halaman" className="flex items-center justify-between text-sm">
              <span className="text-muted tabular-nums">
                {(filters.page - 1) * PAGE_SIZE + 1}–{Math.min(filters.page * PAGE_SIZE, total)} dari {total}
              </span>
              <div className="flex gap-2">
                {filters.page > 1 && <Link href={qs({ page: filters.page - 1 })} className={btn.secondary}>← Sebelumnya</Link>}
                {filters.page < pages && <Link href={qs({ page: filters.page + 1 })} className={btn.secondary}>Berikutnya →</Link>}
              </div>
            </nav>
          )}
        </>
      )}
    </>
  );
}

export default function ProductsPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Produk"
        description="Kelola katalog, harga per marketplace, dan kurasi."
        action={<Link href="/admin/products/new" className={btn.primary}>+ Tambah produk</Link>}
      />
      <Suspense fallback={<TableSkeleton />}>
        <ProductTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
