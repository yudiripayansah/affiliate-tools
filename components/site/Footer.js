import Link from 'next/link';
import { getCategories } from '@/lib/catalog';
import { ConsentReset } from './Consent';
import { Logo } from './Header';

const ABOUT = [['/tentang', 'Tentang Fauqa'], ['/disclosure', 'Disclosure affiliate'], ['/privasi', 'Kebijakan privasi'], ['/kontak', 'Kontak']];
const MARKETS = [['shopee', 'Shopee'], ['tokopedia', 'Tokopedia'], ['tiktok', 'TikTok Shop']];

function Col({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm text-[#a3a3a3]">{children}</ul>
    </div>
  );
}

export default async function Footer() {
  const categories = (await getCategories()).filter((c) => c.count > 0);
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-6">
        <div className="max-w-sm">
          <Logo className="text-2xl" />
          <p className="mt-4 text-sm leading-relaxed text-[#a3a3a3]">
            Rekomendasi produk dari toko resmi di Shopee, Tokopedia, dan TikTok Shop, lengkap dengan perbandingan harga.
            Kamu membeli langsung di marketplace; kami bisa mendapat komisi tanpa biaya tambahan untukmu.
          </p>
        </div>
        <Col title="Kategori">
          {categories.map((c) => <li key={c.slug}><Link href={`/c/${c.slug}`} className="hover:text-white">{c.name}</Link></li>)}
        </Col>
        <Col title="Belanja di">
          {MARKETS.map(([m, label]) => <li key={m}><Link href={`/promo?m=${m}`} className="hover:text-white">Promo {label}</Link></li>)}
        </Col>
        <Col title="Fauqa">
          {ABOUT.map(([href, label]) => <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}
          <li><ConsentReset className="text-left hover:text-white" /></li>
        </Col>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-[#a3a3a3] md:px-6">© Fauqa. Harga dan ketersediaan mengikuti marketplace.</p>
      </div>
    </footer>
  );
}
