import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';
import { exportProducts } from '@/lib/admin/import';
import { productToRow, toCsv } from '@/lib/admin/csv';

const TEMPLATE_ROW = {
  slug: 'contoh-tws-earbuds', name: 'Contoh TWS Earbuds', brand: 'Contoh Brand', category_slug: 'elektronik', description: 'Deskripsi singkat produk.',
  is_active: 'ya', is_featured: 'tidak', badge: 'promo', sort_order: 0,
  highlights: 'ANC aktif | Baterai 30 jam', pros: 'Suara jernih | Ringan', cons: 'Case mudah tergores',
  specs: 'Baterai: 30 jam | Bluetooth: 5.3', images: 'https://contoh.com/gambar-1.jpg | https://contoh.com/gambar-2.jpg',
  shopee_url: 'https://s.shopee.co.id/xxxx', shopee_price: '229000', shopee_original: '279000',
  tokopedia_url: 'https://tokopedia.link/xxxx', tokopedia_price: '235000', tokopedia_original: '',
  tiktok_url: '', tiktok_price: '', tiktok_original: '',
};

// GET /admin/export -> semua produk ; ?template=1 -> template berisi 1 contoh baris.
export async function GET(req) {
  if (!verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)) return new Response('Unauthorized', { status: 401 });

  const template = req.nextUrl.searchParams.has('template');
  const rows = template ? [TEMPLATE_ROW] : (await exportProducts()).map(productToRow);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${template ? 'template-produk-fauqa' : `produk-fauqa-${date}`}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
