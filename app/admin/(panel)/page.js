import { Suspense } from 'react';
import Link from 'next/link';
import { PERIODS, getDashboard } from '@/lib/admin/analytics';
import ClicksChart from '@/components/admin/ClicksChart';
import { SubmitButton } from '@/components/admin/client';
import { refreshSiteCache } from './cache-actions';
import { Card, PageHeader, TableSkeleton, btn, inlineInputCls, td, th } from '@/components/admin/ui';

export const metadata = { title: { absolute: 'Dashboard · Admin Fauqa' } };

const LABEL = { shopee: 'Shopee', tokopedia: 'Tokopedia', tiktok: 'TikTok Shop' };
const BAR = { shopee: 'bg-chart-shopee', tokopedia: 'bg-chart-tokopedia', tiktok: 'bg-chart-tiktok' };
const BREAKDOWN_TITLE = { category: 'Kategori', source: 'Penempatan tombol', utm_source: 'UTM source', utm_campaign: 'UTM campaign', country: 'Negara' };
const num = (n) => new Intl.NumberFormat('id-ID').format(n);
const fmtDay = (ymd) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`));

function Delta({ value, prev, prevLabel }) {
  if (!prev) return <p className="mt-1 text-xs text-muted">{value ? `vs 0 ${prevLabel}` : '—'}</p>;
  const pct = ((value - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <p className="mt-1 text-xs text-muted">
      <span className="font-medium text-ink">{up ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}%</span> vs {prevLabel} ({num(prev)})
    </p>
  );
}

function Breakdown({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.clicks));
  return (
    <Card title={title}>
      {rows.length ? (
        <ul className="space-y-2.5 text-sm">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="flex justify-between gap-3"><span className="truncate">{r.key}</span><span className="tabular-nums text-muted">{num(r.clicks)}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-line"><div className="h-1.5 rounded-full bg-ink/60" style={{ width: `${(r.clicks / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">Belum ada data.</p>}
    </Card>
  );
}

async function Dashboard({ searchParams }) {
  const sp = await searchParams;
  const d = await getDashboard(sp);
  const { range } = d;

  return (
    <>
      {/* Filter periode: satu baris di atas grafik */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <Link key={p} href={`?days=${p}`} aria-current={range.mode === 'preset' && range.days === p ? 'page' : undefined}
            className={`rounded-lg border px-3 py-1.5 text-sm ${range.mode === 'preset' && range.days === p ? 'border-ink bg-ink text-bg' : 'border-line bg-surface hover:bg-line/50'}`}>
            {p} hari
          </Link>
        ))}
        <form className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <label className="sr-only" htmlFor="from">Dari tanggal</label>
          <input id="from" name="from" type="date" defaultValue={range.from} className={`${inlineInputCls} py-1.5`} />
          <span className="text-sm text-muted">–</span>
          <label className="sr-only" htmlFor="to">Sampai tanggal</label>
          <input id="to" name="to" type="date" defaultValue={range.to} className={`${inlineInputCls} py-1.5`} />
          <button className={btn.secondary}>Terapkan</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {d.kpi.map((k) => (
          <div key={k.label} className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">Klik {k.label.toLowerCase()}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{num(k.value)}</p>
            <Delta value={k.value} prev={k.prev} prevLabel={k.prevLabel} />
          </div>
        ))}
      </div>

      <Card title={`Tren klik · ${fmtDay(range.from)} – ${fmtDay(range.to)}`} description={`${num(d.total)} klik (tanpa bot). Waktu dalam WIB.`}>
        <ClicksChart days={d.days} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card title="Distribusi marketplace">
          <ul className="space-y-4">
            {d.marketplaces.map((m) => (
              <li key={m.marketplace}>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><span className={`size-2.5 rounded-sm ${BAR[m.marketplace]}`} />{LABEL[m.marketplace]}</span>
                  <span className="tabular-nums text-muted">{num(m.clicks)} · {m.percent.toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-line"><div className={`h-2 rounded-full ${BAR[m.marketplace]}`} style={{ width: `${m.percent}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Produk teratas">
          {d.top.length ? (
            <table className="w-full text-sm">
              <thead><tr><th className={`${th} px-0`}>#</th><th className={th}>Produk</th><th className={`${th} text-right`}>Klik</th></tr></thead>
              <tbody>
                {d.top.map((p, i) => (
                  <tr key={p.product_id} className="border-t border-line">
                    <td className={`${td} px-0 text-muted tabular-nums`}>{i + 1}</td>
                    <td className={td}><Link href={`/admin/products/${p.product_id}`} className="hover:underline">{p.name}</Link></td>
                    <td className={`${td} text-right tabular-nums`}>{num(p.clicks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-sm text-muted">Belum ada klik di periode ini.</p>}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(d.breakdowns).map(([dim, rows]) => <Breakdown key={dim} title={BREAKDOWN_TITLE[dim]} rows={rows} />)}
      </div>
    </>
  );
}

export default function DashboardPage({ searchParams }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Dashboard"
        description="Klik keluar ke marketplace, tercatat di database sendiri (tanpa terpengaruh ad-blocker)."
        action={
          <form action={refreshSiteCache} title="Pakai setelah mengubah data langsung di Supabase">
            <SubmitButton className={btn.secondary} pendingText="Menyegarkan…">Segarkan data situs</SubmitButton>
          </form>
        }
      />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
