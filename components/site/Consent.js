'use client';

// Persetujuan cookie analytics. GA4 & Clarity HANYA dimuat setelah "Terima".
// Tracking klik di Supabase (first-party, IP di-hash) tidak bergantung pada pilihan ini.
import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const COOKIE = 'fauqa_consent';
const EVENT = 'fauqa-consent';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

const read = () => document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(granted|denied)`))?.[1] ?? 'unset';
const subscribe = (cb) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
const useConsent = () => useSyncExternalStore(subscribe, read, () => 'pending');

function setConsent(value) {
  document.cookie = value
    ? `${COOKIE}=${value}; path=/; max-age=${180 * 86400}; samesite=lax`
    : `${COOKIE}=; path=/; max-age=0`;
  window.dispatchEvent(new Event(EVENT));
}

function Analytics() {
  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}</Script>
        </>
      )}
      {CLARITY_ID && (
        // id JANGAN "clarity": elemen ber-id menjadi window.clarity dan merusak snippet Clarity.
        <Script id="ms-clarity-init" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `}</Script>
      )}
    </>
  );
}

export default function Consent() {
  const consent = useConsent();
  if (consent === 'granted') return <Analytics />;
  if (consent !== 'unset') return null;

  return (
    <section
      aria-label="Persetujuan cookie"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-line bg-surface p-5 shadow-[0_8px_30px_rgb(0_0_0/0.12)] sm:inset-x-6"
    >
      <p className="text-sm leading-relaxed">
        Kami memakai Google Analytics dan Microsoft Clarity untuk memahami cara situs ini dipakai. Keduanya hanya aktif jika kamu setuju.{' '}
        <Link href="/privasi" className="font-semibold underline underline-offset-2">Kebijakan privasi</Link>
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setConsent('granted')} className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white">Terima</button>
        <button type="button" onClick={() => setConsent('denied')} className="flex-1 rounded-full border border-ink px-4 py-2.5 text-sm font-semibold">Tolak</button>
      </div>
    </section>
  );
}

// Tombol di footer untuk membuka kembali pilihan cookie.
export function ConsentReset({ className = 'text-left text-muted hover:text-ink' }) {
  return (
    <button type="button" onClick={() => setConsent(null)} className={className}>
      Pengaturan cookie
    </button>
  );
}
