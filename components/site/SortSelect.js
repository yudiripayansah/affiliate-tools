'use client';

// Dropdown urutan: ganti param `sort` di URL (reset ke halaman 1).
import { useRouter, useSearchParams } from 'next/navigation';

const SORTS = { populer: 'Populer', termurah: 'Termurah', diskon: 'Diskon terbesar', terbaru: 'Terbaru' };

export default function SortSelect({ value }) {
  const router = useRouter();
  const params = useSearchParams();

  const onChange = (e) => {
    const next = new URLSearchParams(params);
    next.set('sort', e.target.value);
    next.delete('page');
    router.push(`?${next}`, { scroll: false });
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Urutkan</span>
      <select value={value} onChange={onChange} className="rounded-full border border-line bg-surface py-2 pl-3 pr-8 text-sm font-semibold">
        {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </label>
  );
}
