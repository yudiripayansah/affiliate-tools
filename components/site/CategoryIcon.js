// Ikon kategori warna-warni (SVG inline, dekoratif). Gambar kategori dari admin, bila ada, diprioritaskan oleh pemanggil.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

const ICONS = {
  handphone: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" {...S} /><path d="M11 18.5h2" {...S} /></>,
  'audio-aksesoris': <><path d="M4 15v-3a8 8 0 0 1 16 0v3" {...S} /><rect x="3" y="14" width="4.5" height="6.5" rx="1.5" {...S} /><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.5" {...S} /></>,
  'laptop-komputer': <><rect x="4" y="5" width="16" height="11" rx="1.5" {...S} /><path d="M2 19.5h20" {...S} /></>,
  'elektronik-rumah': <><rect x="6" y="2.5" width="12" height="19" rx="2" {...S} /><path d="M6 9.5h12M9 5.5v2M9 12.5v3" {...S} /></>,
  dapur: <><path d="M4 10.5h16v5.5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" {...S} /><path d="M2 10.5h2M20 10.5h2M9.5 7c0-1 1-1.8 1-3M13.5 7c0-1 1-1.8 1-3" {...S} /></>,
  kecantikan: <><path d="M9 21.5V12h6v9.5z" {...S} /><path d="M10.5 12V7.5L14 4.5V12" {...S} /></>,
  fashion: <><path d="M8 3.5 4 6.5l2 4 2-1v11h8v-11l2 1 2-4-4-3a4 4 0 0 1-8 0z" {...S} /></>,
  'rumah-hidup': <><path d="M3 11 12 4l9 7" {...S} /><path d="M5 9.5V20h14V9.5M10 20v-5.5h4V20" {...S} /></>,
};

// Pasangan pastel (latar) + pekat (ikon); ikon dekoratif, nama kategori selalu tertulis di sampingnya.
const COLORS = {
  handphone: ['#e8f0ff', '#2457e6'],
  'audio-aksesoris': ['#f3e8ff', '#8b2ce0'],
  'laptop-komputer': ['#e3f6f3', '#0f8c7e'],
  'elektronik-rumah': ['#fff1db', '#c96f00'],
  dapur: ['#ffeae3', '#e0481f'],
  kecantikan: ['#ffe6f0', '#d6246e'],
  fashion: ['#fff6cc', '#9a7400'],
  'rumah-hidup': ['#e6f5e3', '#2e8b2e'],
};
const FALLBACK = [['#e8f0ff', '#2457e6'], ['#ffeae3', '#e0481f'], ['#e6f5e3', '#2e8b2e'], ['#f3e8ff', '#8b2ce0']];

export function categoryColors(slug, index = 0) {
  return COLORS[slug] ?? FALLBACK[index % FALLBACK.length];
}

export default function CategoryIcon({ slug, name, index = 0, className = 'size-16' }) {
  const [bg, fg] = categoryColors(slug, index);
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full ${className}`} style={{ background: bg, color: fg }}>
      {ICONS[slug] ? (
        <svg viewBox="0 0 24 24" className="size-[46%]">{ICONS[slug]}</svg>
      ) : (
        <span className="text-xl font-extrabold">{name?.[0]?.toUpperCase()}</span>
      )}
    </span>
  );
}
