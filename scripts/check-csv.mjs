// Self-check lib/admin/csv.js: node scripts/check-csv.mjs
import assert from 'node:assert/strict';
import { parsePrice, parseBool, splitList, analyzeCsv, productToRow, toCsv, COLUMNS } from '../lib/admin/csv.js';

assert.equal(parsePrice('Rp 249.000'), 249000);
assert.equal(parsePrice('249.000'), 249000);
assert.equal(parsePrice('1.249.000'), 1249000);
assert.equal(parsePrice('249000'), 249000);
assert.equal(parsePrice('249000.5'), 249000.5);
assert.equal(parsePrice('249.000,50'), 249000.5);
assert.equal(parsePrice(''), null);
assert.ok(Number.isNaN(parsePrice('dua ratus')));
assert.ok(Number.isNaN(parsePrice('-5')));
assert.equal(parseBool('Ya'), true);
assert.equal(parseBool('tidak'), false);
assert.equal(parseBool('', true), true);
assert.equal(parseBool('mungkin'), undefined);
assert.deepEqual(splitList(' a | b |  | c '), ['a', 'b', 'c']);

const ctx = {
  categories: new Map([['elektronik', 'cat-1']]),
  existing: new Map([['lama', { id: 'p-1', images: [{ url: 'https://x/old.jpg', alt: 'old' }] }]]),
};
const csv = [
  'slug,name,category_slug,badge,highlights,specs,images,shopee_url,shopee_price,shopee_original,tokopedia_url,tokopedia_price',
  'baru-1,Produk Baru,elektronik,promo,ANC | Baterai 30 jam,Baterai: 30 jam | BT: 5.3,https://x/a.jpg | https://x/b.jpg,https://s.shopee.co.id/a,Rp 199.000,249.000,,',
  'lama,"Produk Lama, Edisi 2",,,,,,https://s.shopee.co.id/b,100000,,https://tokopedia.link/b,95000',
  'BAD SLUG,,tidak-ada,diskon,,tanpa titik dua,http://x/a.jpg,http://s.shopee.co.id,abc,,,',
  'baru-1,Duplikat,,,,,,https://s.shopee.co.id/c,1,,,',
  'kosong,Tanpa Link,,,,,,,,,,',
].join('\n');
const a = analyzeCsv('﻿' + csv, ctx);
assert.deepEqual(a.summary, { total: 5, new: 1, update: 1, error: 3 });

const [r1, r2, r3, r4, r5] = a.results;
assert.equal(r1.status, 'new');
assert.equal(r1.line, 2);
assert.equal(r1.payload.category_id, 'cat-1');
assert.deepEqual(r1.payload.highlights, ['ANC', 'Baterai 30 jam']);
assert.deepEqual(r1.payload.specs, [{ label: 'Baterai', value: '30 jam' }, { label: 'BT', value: '5.3' }]);
assert.equal(r1.payload.images.length, 2);
assert.deepEqual(r1.payload.links, [{ marketplace: 'shopee', url: 'https://s.shopee.co.id/a', price: 199000, original_price: 249000 }]);

assert.equal(r2.status, 'update');
assert.equal(r2.payload.id, 'p-1');
assert.equal(r2.name, 'Produk Lama, Edisi 2', 'koma di dalam kutip');
assert.deepEqual(r2.payload.images, [{ url: 'https://x/old.jpg', alt: 'old' }], 'images kosong -> pertahankan gambar lama');
assert.equal(r2.payload.links.length, 2);

assert.equal(r3.status, 'error');
for (const msg of ['slug tidak valid', 'name wajib', 'kategori "tidak-ada"', 'badge harus', 'specs harus', 'images harus', 'shopee_url harus', 'shopee_price wajib']) {
  assert.ok(r3.errors.some((e) => e.includes(msg)), `error berisi: ${msg}`);
}
assert.ok(r4.errors.some((e) => e.includes('slug duplikat dengan baris 2')));
assert.ok(r5.errors.some((e) => e.includes('minimal 1 marketplace')));

assert.match(analyzeCsv('nama,harga\nx,1', ctx).fatal, /Kolom wajib tidak ada: slug, name/);
assert.match(analyzeCsv('slug,name\n', ctx).fatal, /tidak berisi data/);

// Round-trip: export -> import menghasilkan payload yang sama.
const prod = { slug: 'rt', name: 'Round Trip', brand: 'Acme', category: { slug: 'elektronik' }, description: 'D', is_active: true, is_featured: false, badge: 'baru', sort_order: 2,
  highlights: ['a', 'b'], pros: ['p'], cons: [], specs: [{ label: 'L', value: 'V' }], images: [{ url: 'https://x/1.jpg', sort_order: 0 }],
  links: [{ marketplace: 'tiktok', url: 'https://vt.tokopedia.com/z', price: 50000, original_price: 60000 }] };
const out = toCsv([productToRow(prod)]);
assert.ok(out.startsWith('﻿' + COLUMNS.join(',')));
const back = analyzeCsv(out, { categories: ctx.categories, existing: new Map() }).results[0];
assert.equal(back.status, 'new');
assert.deepEqual(back.payload.links, prod.links);
assert.deepEqual(back.payload.specs, prod.specs);
assert.equal(back.payload.badge, 'baru');
assert.equal(back.payload.sort_order, 2);
assert.equal(back.payload.brand, 'Acme', 'brand round-trip');
console.log('csv: ALL OK');
