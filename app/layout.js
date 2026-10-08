import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

// Satu keluarga font untuk storefront & admin (variable font, bobot 200–800).
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Fauqa — Rekomendasi produk pilihan', template: '%s | Fauqa' },
  description: 'Fauqa mengkurasi produk terbaik dari Shopee, Tokopedia, dan TikTok Shop, lengkap dengan perbandingan harga.',
  openGraph: { siteName: 'Fauqa', locale: 'id_ID', type: 'website' },
};

// Root layout minimal; header, footer, consent & analytics hanya di storefront (app/(site)/layout.js).
export default function RootLayout({ children }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="bg-bg font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
