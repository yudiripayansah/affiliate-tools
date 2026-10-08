# Fauqa

Situs kurasi produk affiliate. Fauqa menampilkan produk pilihan dari Shopee, Tokopedia, dan TikTok Shop,
membandingkan harganya per marketplace, lalu mengarahkan pembeli ke marketplace lewat link affiliate.
Setiap klik keluar dicatat di database sendiri, dan semua konten dikelola dari panel admin.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS 4 · Supabase (Postgres + Storage).

## Fitur

**Storefront**
- Homepage (hero/banner, Pilihan editor, kategori, Sedang turun harga, Baru masuk)
- Halaman kategori `/c/[slug]` dengan urutan & filter marketplace, pencarian `/cari`
- Halaman produk `/p/[slug]` dengan perbandingan harga per marketplace dan tombol beli
- Halaman statis `/tentang`, `/disclosure`, `/privasi`, `/kontak`
- Light & dark mode mengikuti sistem, sitemap, JSON-LD, Open Graph
- Banner persetujuan cookie: GA4 & Microsoft Clarity hanya dimuat setelah pengunjung menyetujui

**Admin** (`/admin`, login dengan password)
- Dashboard klik: KPI, grafik tren harian, distribusi marketplace, breakdown, produk teratas
- Produk (harga per marketplace, galeri, highlight, spesifikasi, badge, aksi massal), kategori, banner, halaman statis
- Import / export produk lewat CSV

**Tracking klik:** semua tombol beli melewati `/api/outbound`, yang mencatat klik (IP disimpan sebagai hash)
lalu redirect 302 ke marketplace.

## Menjalankan secara lokal

Butuh Node.js 20+ dan satu project Supabase.

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya (lihat tabel di bawah)
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Wajib | Keterangan |
|---|---|---|
| `SUPABASE_URL` | ya | URL project Supabase (`https://<ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | ya | Secret/service role key. **Server only** — jangan diberi prefix `NEXT_PUBLIC_` |
| `IP_HASH_SALT` | ya | String acak panjang untuk hash IP (`openssl rand -hex 32`) |
| `ADMIN_PASSWORD` | ya | Password login `/admin` |
| `ADMIN_SESSION_SECRET` | ya | Kunci tanda tangan session admin (`openssl rand -hex 32`). Ganti untuk me-logout semua session |
| `NEXT_PUBLIC_SITE_URL` | produksi | Domain publik, dipakai untuk canonical, sitemap, Open Graph |
| `NEXT_PUBLIC_GA_ID` | opsional | Measurement ID GA4 (`G-…`) |
| `NEXT_PUBLIC_CLARITY_ID` | opsional | Project ID Microsoft Clarity |

### Database

Jalankan file SQL berikut **berurutan** di Supabase → SQL Editor:

1. `supabase/schema.sql` — tabel dasar, RLS, fungsi analytics awal
2. `supabase/phase2.sql` — konten produk, galeri, harga per marketplace, banner, halaman statis, bucket Storage `media`
3. `supabase/phase2b_products.sql` — fungsi `save_product` & `duplicate_product` (simpan atomik)
4. `supabase/phase2c_import.sql` — fungsi `import_products` (import CSV massal)

Semua tabel memakai RLS tanpa policy: hanya server (service role) yang bisa membaca/menulis.

## Struktur proyek

```
app/
  (site)/            storefront: home, /c, /p, /cari, halaman statis
  admin/             panel admin (login, (panel)/…, export CSV)
  api/outbound/      pencatatan klik + redirect ke marketplace
components/
  site/              komponen storefront
  admin/             komponen admin
lib/
  catalog.js         data storefront (di-cache, diberi tag)
  db.js              outbound & pencatatan klik
  admin/             data, validasi, CSV, dan Server Action admin
  session.js         session admin (cookie bertanda tangan HMAC)
  markdown.js        render Markdown aman untuk halaman statis
proxy.js             proteksi /admin + redirect URL kategori lama
supabase/            file SQL
scripts/             self-check
```

Cache storefront memakai `'use cache'` + `cacheTag`; setiap Server Action admin memanggil `updateTag`
sehingga perubahan langsung tampil di storefront.

## Pengecekan

```bash
npm run lint
node --env-file=.env.local scripts/check-session.mjs
node scripts/check-form.mjs
node scripts/check-markdown.mjs
node scripts/check-csv.mjs
node scripts/check-range.mjs
```

Catatan saat development:
- Jangan menjalankan `npm run build` di folder proyek selama `npm run dev` hidup — build ikut menulis ke `.next/dev`
  dan dev server berhenti membaca perubahan. Matikan dev server dulu, atau build di salinan folder.
- Watcher Turbopack kadang melewatkan perubahan `app/globals.css`. Cek dengan
  `sh scripts/css-fresh.sh "<teks yang baru ditambahkan>"`.

## Deploy (Vercel)

1. Import repo ke Vercel, isi semua environment variable di atas (termasuk `NEXT_PUBLIC_SITE_URL`).
2. Pastikan keempat file SQL sudah dijalankan di project Supabase produksi.
3. Setelah deploy: buka `/sitemap.xml`, daftarkan ke Google Search Console, dan uji preview link produk di WhatsApp.
4. Di GA4: buat custom dimension `marketplace`, `product_slug`, `source`, lalu tandai event `affiliate_click` sebagai Key event.
