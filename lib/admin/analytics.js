// Data dashboard admin. Batas hari memakai WIB (UTC+7), sama dengan fungsi SQL clicks_daily.
import { connection } from 'next/server';
import { db } from '@/lib/supabase';
import { CHART_ORDER, DAY, resolveRange, wibMidnight, wibYmd } from '@/lib/admin/range';

export { CHART_ORDER, PERIODS } from '@/lib/admin/range';

const rpc = async (fn, args) => {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw error;
  return data;
};
const total = (rows) => rows.reduce((s, r) => s + Number(r.clicks), 0);
const countBetween = async (since, until) => total(await rpc('clicks_by_marketplace', { since: since.toISOString(), until: until.toISOString() }));

async function kpis(now) {
  const todayStart = wibMidnight(wibYmd(now));
  const at = (offsetDays) => new Date(todayStart.getTime() - offsetDays * DAY);
  const nowD = new Date(now);
  const [today, yesterday, d7, p7, d30, p30] = await Promise.all([
    countBetween(todayStart, nowD),
    countBetween(at(1), todayStart),
    countBetween(at(6), nowD),
    countBetween(at(13), at(6)),
    countBetween(at(29), nowD),
    countBetween(at(59), at(29)),
  ]);
  return [
    { label: 'Hari ini', value: today, prev: yesterday, prevLabel: 'kemarin' },
    { label: '7 hari', value: d7, prev: p7, prevLabel: '7 hari sebelumnya' },
    { label: '30 hari', value: d30, prev: p30, prevLabel: '30 hari sebelumnya' },
  ];
}

export async function getDashboard(params) {
  await connection(); // data per request: "sekarang" harus waktu request, bukan waktu prerender
  const now = Date.now();
  const range = resolveRange(params, now);
  const args = { since: range.since.toISOString(), until: range.until.toISOString() };
  const dims = ['category', 'source', 'utm_source', 'utm_campaign', 'country'];

  const [kpi, daily, byMarket, top, ...breakdowns] = await Promise.all([
    kpis(now),
    rpc('clicks_daily', args),
    rpc('clicks_by_marketplace', args),
    rpc('top_products', { ...args, lim: 10 }),
    ...dims.map((dim) => rpc('clicks_breakdown', { dim, ...args, lim: 8 })),
  ]);

  // Isi hari tanpa klik dengan 0 supaya sumbu waktu tidak bolong.
  const days = [];
  for (let t = range.since.getTime(); t < range.until.getTime(); t += DAY) {
    const day = wibYmd(t);
    const row = { day, ...Object.fromEntries(CHART_ORDER.map((m) => [m, 0])) };
    for (const r of daily) if (r.day === day) row[r.marketplace] = Number(r.clicks);
    days.push(row);
  }

  const sum = total(byMarket);
  return {
    range,
    kpi,
    days,
    total: sum,
    marketplaces: CHART_ORDER.map((m) => {
      const clicks = Number(byMarket.find((r) => r.marketplace === m)?.clicks ?? 0);
      return { marketplace: m, clicks, percent: sum ? (clicks / sum) * 100 : 0 };
    }),
    top: top.map((r) => ({ ...r, clicks: Number(r.clicks) })),
    breakdowns: Object.fromEntries(dims.map((d, i) => [d, breakdowns[i].map((r) => ({ key: r.key, clicks: Number(r.clicks) }))])),
  };
}
