-- ================= Phase 2 migration =================
-- Jalankan setelah supabase/schema.sql (Phase 1).

create extension if not exists pg_trgm with schema extensions;

-- ---------- products: konten & kurasi ----------
alter table products
  add column highlights  text[] not null default '{}',
  add column pros        text[] not null default '{}',
  add column cons        text[] not null default '{}',
  add column specs       jsonb  not null default '[]'::jsonb,   -- [{ "label": "...", "value": "..." }]
  add column badge       text check (badge in ('terlaris', 'promo', 'pilihan_editor', 'baru')),
  add column is_featured boolean not null default false,
  add column sort_order  int not null default 0;

create index products_name_trgm_idx on products using gin (name extensions.gin_trgm_ops);
create index products_featured_idx  on products (sort_order) where is_active and is_featured;

-- ---------- product_images (galeri) ----------
create table product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url        text not null check (url ~ '^https://'),
  alt        text,
  sort_order int  not null default 0
);
create index product_images_product_idx on product_images (product_id, sort_order);

insert into product_images (product_id, url, alt)
select id, image_url, name from products where image_url ~ '^https://';

-- ---------- product_links: harga per marketplace ----------
alter table product_links
  add column price          numeric(12,2),
  add column original_price numeric(12,2),
  add column updated_at     timestamptz not null default now();

update product_links l set price = coalesce(p.price, 0) from products p where p.id = l.product_id;

alter table product_links
  alter column price set not null,
  add constraint product_links_price_check check (price >= 0),
  add constraint product_links_original_price_check check (original_price is null or original_price > price);

create trigger product_links_updated_at before update on product_links
  for each row execute function set_updated_at();

alter table products drop column price, drop column image_url;

-- ---------- categories ----------
alter table categories
  add column description text,
  add column image_url   text check (image_url ~ '^https://');

-- ---------- banners ----------
create table banners (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  subtitle      text,
  image_desktop text not null check (image_desktop ~ '^https://'),
  image_mobile  text check (image_mobile ~ '^https://'),
  href          text not null check (href ~ '^/' or href ~ '^https://'),
  starts_at     timestamptz,
  ends_at       timestamptz,
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);

-- ---------- pages (halaman statis) ----------
create table pages (
  slug       text primary key check (slug in ('tentang', 'disclosure', 'privasi', 'kontak')),
  title      text not null,
  body_md    text not null default '',
  updated_at timestamptz not null default now()
);

create trigger pages_updated_at before update on pages
  for each row execute function set_updated_at();

alter table product_images enable row level security;
alter table banners        enable row level security;
alter table pages          enable row level security;

-- ---------- Storage: bucket media ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

-- ---------- Fungsi analytics (ganti versi Phase 1: tambah batas `until`) ----------
drop function clicks_by_marketplace(timestamptz);
drop function top_products(timestamptz, int);

create function clicks_by_marketplace(since timestamptz, until timestamptz default now())
returns table (marketplace marketplace, clicks bigint)
language sql stable set search_path = public as $$
  select marketplace, count(*)
  from click_events
  where not is_bot and clicked_at >= since and clicked_at < until
  group by 1 order by 2 desc
$$;

create function top_products(since timestamptz, until timestamptz default now(), lim int default 10)
returns table (product_id uuid, name text, slug text, clicks bigint)
language sql stable set search_path = public as $$
  select p.id, p.name, p.slug, count(*)
  from click_events c join products p on p.id = c.product_id
  where not c.is_bot and c.clicked_at >= since and c.clicked_at < until
  group by p.id, p.name, p.slug
  order by 4 desc limit lim
$$;

-- Klik per hari (zona Asia/Jakarta) per marketplace, untuk grafik tren.
create function clicks_daily(since timestamptz, until timestamptz default now())
returns table (day date, marketplace marketplace, clicks bigint)
language sql stable set search_path = public as $$
  select (clicked_at at time zone 'Asia/Jakarta')::date, marketplace, count(*)
  from click_events
  where not is_bot and clicked_at >= since and clicked_at < until
  group by 1, 2 order by 1
$$;

-- Breakdown klik per dimensi. `dim` di-whitelist; nilai lain -> error.
create function clicks_breakdown(dim text, since timestamptz, until timestamptz default now(), lim int default 10)
returns table (key text, clicks bigint)
language plpgsql stable set search_path = public as $$
begin
  if dim not in ('category', 'source', 'utm_source', 'utm_campaign', 'country') then
    raise exception 'invalid dim: %', dim;
  end if;
  return query
    select coalesce(case dim
             when 'category'     then cat.name
             when 'source'       then c.source
             when 'utm_source'   then c.utm_source
             when 'utm_campaign' then c.utm_campaign
             when 'country'      then c.country
           end, '(tidak ada)') as key,
           count(*) as clicks
    from click_events c
    join products p on p.id = c.product_id
    left join categories cat on cat.id = p.category_id
    where not c.is_bot and c.clicked_at >= since and c.clicked_at < until
    group by 1 order by 2 desc limit lim;
end $$;

-- Klik N hari terakhir per produk, untuk sort "Populer" di storefront.
create function product_popularity(days int default 30)
returns table (product_id uuid, clicks bigint)
language sql stable set search_path = public as $$
  select product_id, count(*)
  from click_events
  where not is_bot and clicked_at >= now() - make_interval(days => days)
  group by 1
$$;

revoke execute on function clicks_by_marketplace(timestamptz, timestamptz)        from public, anon, authenticated;
revoke execute on function top_products(timestamptz, timestamptz, int)             from public, anon, authenticated;
revoke execute on function clicks_daily(timestamptz, timestamptz)                  from public, anon, authenticated;
revoke execute on function clicks_breakdown(text, timestamptz, timestamptz, int)   from public, anon, authenticated;
revoke execute on function product_popularity(int)                                 from public, anon, authenticated;

-- ---------- Seed halaman statis (draft, edit dari admin) ----------
insert into pages (slug, title, body_md) values
('tentang', 'Tentang Fauqa', $md$
Fauqa adalah kurator rekomendasi produk. Kami menyaring ribuan produk di marketplace supaya kamu tidak perlu.

## Cara kami memilih

- Kami membandingkan spesifikasi, harga, dan ulasan pembeli di beberapa marketplace.
- Kami hanya menampilkan produk dari toko dengan reputasi baik.
- Harga dan ketersediaan kami perbarui secara berkala, tetapi bisa berubah sewaktu-waktu di marketplace.

## Kamu tetap membeli di marketplace resmi

Fauqa tidak menjual barang. Saat kamu menekan tombol beli, kamu diarahkan ke Shopee, Tokopedia, atau TikTok Shop dan bertransaksi langsung di sana.
$md$),
('disclosure', 'Disclosure Affiliate', $md$
Sebagian link di Fauqa adalah link affiliate. Jika kamu membeli melalui link tersebut, kami dapat menerima komisi dari marketplace **tanpa biaya tambahan untukmu**.

Komisi ini membantu kami terus mengkurasi produk. Komisi tidak memengaruhi produk yang kami rekomendasikan maupun urutan tampilannya.
$md$),
('privasi', 'Kebijakan Privasi', $md$
_Terakhir diperbarui: tanggal halaman ini disimpan._

## Data yang kami kumpulkan

- **Klik ke marketplace**: produk yang diklik, marketplace tujuan, halaman asal, parameter UTM, perkiraan negara, jenis browser, dan alamat IP dalam bentuk **hash** (tidak bisa dikembalikan ke IP asli). Data ini dipakai untuk mengetahui produk mana yang diminati.
- **Google Analytics 4 & Microsoft Clarity**: hanya aktif **jika kamu menyetujui cookie**. Keduanya mengumpulkan data penggunaan situs (halaman yang dibuka, interaksi, rekaman sesi anonim di Clarity).

## Pilihanmu

Kamu bisa menolak cookie analytics melalui banner cookie. Pilihan disimpan di browsermu dan bisa diubah dengan menghapus cookie situs ini.

## Kontak

Pertanyaan tentang privasi bisa dikirim melalui halaman Kontak.
$md$),
('kontak', 'Kontak', $md$
Ada pertanyaan, saran produk, atau tawaran kerja sama? Hubungi kami:

- Email: **(isi email)**
- Instagram: **(isi akun)**
$md$);
