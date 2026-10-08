-- ========== Enum marketplace ==========
create type marketplace as enum ('shopee', 'tokopedia', 'tiktok');
-- Tambah marketplace baru nanti: alter type marketplace add value 'lazada';

-- ========== categories ==========
create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ========== products ==========
create table products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  description text,
  image_url   text,
  price       numeric(12,2),
  currency    char(3) not null default 'IDR',
  category_id uuid references categories(id) on delete set null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index products_category_idx on products (category_id) where is_active;

-- ========== product_links (1 produk -> banyak marketplace) ==========
create table product_links (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  marketplace marketplace not null,
  url         text not null check (url ~ '^https://'),
  unique (product_id, marketplace)
);

-- ========== click_events ==========
create table click_events (
  id           bigint generated always as identity primary key,
  product_id   uuid not null references products(id) on delete cascade,
  marketplace  marketplace not null,
  clicked_at   timestamptz not null default now(),
  source       text,
  referrer     text,
  user_agent   text,
  ip_hash      text,
  country      text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  is_bot       boolean not null default false
);

create index click_events_time_idx         on click_events (clicked_at desc);
create index click_events_product_time_idx on click_events (product_id, clicked_at desc);

-- ========== auto updated_at ==========
create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

-- ========== RLS: kunci semua tabel ==========
-- Tanpa policy = anon/authenticated tidak bisa akses apa pun.
-- Next.js memakai service role (bypass RLS) dari server saja.
alter table categories    enable row level security;
alter table products      enable row level security;
alter table product_links enable row level security;
alter table click_events  enable row level security;

-- ========== Fungsi analytics (dipanggil via RPC) ==========
create function clicks_by_marketplace(since timestamptz)
returns table (marketplace marketplace, clicks bigint)
language sql stable as $$
  select marketplace, count(*)
  from click_events
  where not is_bot and clicked_at >= since
  group by 1
  order by 2 desc
$$;

create function top_products(since timestamptz, lim int default 10)
returns table (product_id uuid, name text, slug text, clicks bigint)
language sql stable as $$
  select p.id, p.name, p.slug, count(*)
  from click_events c
  join products p on p.id = c.product_id
  where not c.is_bot and c.clicked_at >= since
  group by p.id, p.name, p.slug
  order by 4 desc
  limit lim
$$;

-- Fungsi bisa dipanggil publik via RPC secara default -> cabut, hanya service role.
revoke execute on function clicks_by_marketplace(timestamptz) from public, anon, authenticated;
revoke execute on function top_products(timestamptz, int)    from public, anon, authenticated;

-- Kunci search_path (Supabase advisor: function_search_path_mutable).
alter function set_updated_at()                  set search_path = public;
alter function clicks_by_marketplace(timestamptz) set search_path = public;
alter function top_products(timestamptz, int)     set search_path = public;
