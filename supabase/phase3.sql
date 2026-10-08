-- ================= Phase 3: brand produk & posisi banner =================

alter table products add column brand text;

alter table banners
  add column placement text not null default 'hero' check (placement in ('hero', 'side', 'announcement'));
-- Pengumuman (top bar) tidak butuh gambar; hero & samping tetap wajib.
alter table banners alter column image_desktop drop not null;
alter table banners add constraint banners_image_required check (placement = 'announcement' or image_desktop is not null);

-- save_product kini menyimpan brand.
create or replace function save_product(p jsonb)
returns uuid
language plpgsql set search_path = public as $$
declare
  pid uuid := nullif(p->>'id', '')::uuid;
begin
  if pid is null then
    insert into products (slug, name, brand, description, category_id, highlights, pros, cons, specs, badge, is_featured, sort_order, is_active)
    values (
      p->>'slug', p->>'name', nullif(p->>'brand', ''), nullif(p->>'description', ''), nullif(p->>'category_id', '')::uuid,
      array(select jsonb_array_elements_text(p->'highlights')),
      array(select jsonb_array_elements_text(p->'pros')),
      array(select jsonb_array_elements_text(p->'cons')),
      coalesce(p->'specs', '[]'::jsonb), nullif(p->>'badge', ''),
      coalesce((p->>'is_featured')::boolean, false), coalesce((p->>'sort_order')::int, 0), coalesce((p->>'is_active')::boolean, true)
    )
    returning id into pid;
  else
    update products set
      slug = p->>'slug', name = p->>'name', brand = nullif(p->>'brand', ''), description = nullif(p->>'description', ''),
      category_id = nullif(p->>'category_id', '')::uuid,
      highlights = array(select jsonb_array_elements_text(p->'highlights')),
      pros = array(select jsonb_array_elements_text(p->'pros')),
      cons = array(select jsonb_array_elements_text(p->'cons')),
      specs = coalesce(p->'specs', '[]'::jsonb), badge = nullif(p->>'badge', ''),
      is_featured = coalesce((p->>'is_featured')::boolean, false),
      sort_order = coalesce((p->>'sort_order')::int, 0),
      is_active = coalesce((p->>'is_active')::boolean, true)
    where id = pid;
    if not found then raise exception 'product % not found', pid using errcode = 'P0002'; end if;
  end if;

  delete from product_images where product_id = pid;
  insert into product_images (product_id, url, alt, sort_order)
  select pid, e->>'url', nullif(e->>'alt', ''), (ord - 1)::int
  from jsonb_array_elements(coalesce(p->'images', '[]'::jsonb)) with ordinality as t(e, ord);

  delete from product_links
  where product_id = pid
    and marketplace::text not in (select l->>'marketplace' from jsonb_array_elements(coalesce(p->'links', '[]'::jsonb)) l);
  insert into product_links (product_id, marketplace, url, price, original_price)
  select pid, (l->>'marketplace')::marketplace, l->>'url', (l->>'price')::numeric, nullif(l->>'original_price', '')::numeric
  from jsonb_array_elements(coalesce(p->'links', '[]'::jsonb)) l
  on conflict (product_id, marketplace) do update
    set url = excluded.url, price = excluded.price, original_price = excluded.original_price;

  return pid;
end $$;


-- Isi brand untuk produk yang sudah ada.
update products set brand = case
  when name ilike 'poco%' then 'POCO'
  when name ilike 'xiaomi%' or name ilike 'redmi%' then 'Xiaomi'
  when name ilike 'panasonic%' then 'Panasonic'
  when name ilike 'changhong%' then 'Changhong'
  when name ilike 'polytron%' then 'Polytron'
end
where brand is null;
