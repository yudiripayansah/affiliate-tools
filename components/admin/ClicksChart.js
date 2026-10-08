'use client';

// Batang bertumpuk klik harian per marketplace (HTML/CSS, tanpa library chart).
// Spek dataviz: celah 2px antar segmen, ujung atas membulat, grid samar, legend, tooltip hover, tabel alternatif.
import { useState } from 'react';

const SERIES = [
  { key: 'shopee', label: 'Shopee', bg: 'bg-chart-shopee' },
  { key: 'tiktok', label: 'TikTok Shop', bg: 'bg-chart-tiktok' },
  { key: 'tokopedia', label: 'Tokopedia', bg: 'bg-chart-tokopedia' },
];
const num = (n) => new Intl.NumberFormat('id-ID').format(n);
const dayLabel = (ymd, opts = { day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat('id-ID', { ...opts, timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`));

// Batas atas sumbu Y yang "bulat" (1, 2, 5 × 10^n).
function niceMax(v) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 5, 10].map((m) => m * p).find((m) => m >= v);
}

export default function ClicksChart({ days }) {
  const [hover, setHover] = useState(null);
  const totals = days.map((d) => SERIES.reduce((s, x) => s + d[x.key], 0));
  const max = niceMax(Math.max(0, ...totals));
  const ticks = [0, max / 2, max];
  const labelIdx = new Set([0, Math.floor((days.length - 1) / 2), days.length - 1]);
  const h = hover != null ? days[hover] : null;

  return (
    <figure>
      <figcaption className="sr-only">Klik harian per marketplace</figcaption>
      <ul className="mb-4 flex flex-wrap gap-4 text-sm text-muted" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2"><span className={`size-2.5 rounded-sm ${s.bg}`} />{s.label}</li>
        ))}
      </ul>

      <div className="relative pl-10" onMouseLeave={() => setHover(null)}>
        {/* Grid & label sumbu Y */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 h-48">
          {ticks.map((t) => (
            <div key={t} className="absolute left-10 right-0 border-t border-line/70" style={{ bottom: `${(t / max) * 100}%` }}>
              <span className="absolute -left-10 -translate-y-1/2 text-xs tabular-nums text-muted">{num(t)}</span>
            </div>
          ))}
        </div>

        <div className="relative flex h-48 items-end gap-[2px]" role="presentation">
          {days.map((d, i) => (
            <div
              key={d.day}
              className="group relative flex h-full flex-1 cursor-default flex-col justify-end"
              onMouseEnter={() => setHover(i)}
            >
              {/* hit target = seluruh kolom, lebih besar dari batangnya */}
              <div className={`flex flex-col-reverse gap-[2px] ${hover === i ? 'opacity-100' : hover != null ? 'opacity-50' : ''}`}>
                {SERIES.map((s, si) => {
                  const v = d[s.key];
                  if (!v) return null;
                  const isTop = SERIES.slice(si + 1).every((x) => !d[x.key]);
                  return <div key={s.key} className={`${s.bg} ${isTop ? 'rounded-t' : ''}`} style={{ height: `calc(${(v / max) * 12}rem - 2px)` }} />;
                })}
              </div>
            </div>
          ))}

          {h && (
            <div
              className="pointer-events-none absolute -top-2 z-10 w-44 -translate-y-full rounded-lg border border-line bg-surface p-3 text-xs shadow-lg"
              style={{ left: `clamp(0px, calc(${((hover + 0.5) / days.length) * 100}% - 5.5rem), calc(100% - 11rem))` }}
            >
              <p className="font-medium text-ink">{dayLabel(h.day, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
              <ul className="mt-2 space-y-1">
                {SERIES.map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-3 text-muted">
                    <span className="flex items-center gap-1.5"><span className={`size-2 rounded-sm ${s.bg}`} />{s.label}</span>
                    <span className="tabular-nums text-ink">{num(h[s.key])}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between border-t border-line pt-2 font-medium text-ink"><span>Total</span><span className="tabular-nums">{num(totals[hover])}</span></p>
            </div>
          )}
        </div>

        <div className="relative mt-2 h-4 text-xs text-muted">
          {days.map((d, i) => labelIdx.has(i) && (
            <span key={d.day} className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full" style={{ left: `${((i + 0.5) / days.length) * 100}%` }}>
              {dayLabel(d.day)}
            </span>
          ))}
        </div>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink">Lihat sebagai tabel</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-line">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface text-left text-muted">
              <tr><th className="px-3 py-2">Tanggal</th>{SERIES.map((s) => <th key={s.key} className="px-3 py-2 text-right">{s.label}</th>)}<th className="px-3 py-2 text-right">Total</th></tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr key={d.day} className="border-t border-line">
                  <td className="px-3 py-1.5">{dayLabel(d.day, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  {SERIES.map((s) => <td key={s.key} className="px-3 py-1.5 text-right tabular-nums">{num(d[s.key])}</td>)}
                  <td className="px-3 py-1.5 text-right tabular-nums font-medium">{num(totals[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
