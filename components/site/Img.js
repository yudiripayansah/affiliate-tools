import Image from 'next/image';

// Gambar Supabase Storage dioptimasi next/image; host lain (mis. URL dari CSV) ditampilkan apa adanya
// supaya optimizer tidak bisa dipakai sebagai proxy gambar sembarang host.
const isStorage = (src) => /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//.test(src ?? '');

export default function Img({ src, alt, sizes = '(min-width: 1024px) 25vw, 50vw', className = '', priority = false, fit = 'cover' }) {
  if (!src) return <div className={`flex h-full w-full items-center justify-center bg-line/40 text-xs text-muted ${className}`}>Tanpa gambar</div>;
  return <Image src={src} alt={alt} fill sizes={sizes} loading={priority ? 'eager' : undefined} fetchPriority={priority ? 'high' : undefined} unoptimized={!isStorage(src)} className={`${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`} />;
}
