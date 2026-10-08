import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
import Consent from '@/components/site/Consent';

export default function SiteLayout({ children }) {
  return (
    <>
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">Langsung ke konten</a>
      <Header />
      <main id="konten">{children}</main>
      <Footer />
      <Consent />
    </>
  );
}
