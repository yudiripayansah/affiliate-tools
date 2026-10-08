import { MARKET_LABEL, rupiah } from './format';

const DOT = { shopee: 'bg-shopee', tokopedia: 'bg-tokopedia', tiktok: 'bg-tiktok' };

// Baris perbandingan harga per marketplace. `action(link)` opsional: elemen di ujung kanan baris (mis. tombol beli).
export default function PriceRows({ links, action, compact = false }) {
  return (
    <ul className="divide-y divide-line">
      {links.map((l) => (
        <li key={l.marketplace} className={`flex items-center gap-3 ${compact ? 'py-2.5' : 'py-3.5'} ${l.cheapest && links.length > 1 ? 'relative' : ''}`}>
          <span className={`size-2.5 shrink-0 rounded-full ${DOT[l.marketplace]}`} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm">{MARKET_LABEL[l.marketplace]}</span>
            {l.cheapest && links.length > 1 && <span className="mt-0.5 inline-block rounded bg-brand px-1.5 py-px text-[11px] font-bold text-white">Termurah</span>}
          </span>
          <span className="text-right tabular-nums">
            <span className={`block ${l.cheapest ? 'font-semibold' : ''}`}>{rupiah(l.price)}</span>
            {l.original && <span className="block text-xs text-muted"><s>{rupiah(l.original)}</s> <span className="text-discount">−{l.discount}%</span></span>}
          </span>
          {action?.(l)}
        </li>
      ))}
    </ul>
  );
}
