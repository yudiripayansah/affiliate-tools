-- ================= Phase 2 (B4): simpan & duplikat produk secara atomik =================

-- Simpan produk + galeri + link marketplace dalam 1 transaksi. Mengembalikan id produk.
-- p = { id?, slug, name, description, category_id, highlights[], pros[], cons[], specs[], badge,
--       is_featured, sort_order, is_active, images: [{url, alt}], links: [{marketplace, url, price, original_price}] }
create function save_product(p jsonb)
returns uuid
language plpgsql set search_path = public as $$
declare
  pid uuid := nullif(p->>'id', '')::uuid;
begin
  if pid is null then
    insert into products (slug, name, description, category_id, highlights, pros, cons, specs, badge, is_featured, sort_order, is_active)
    values (
      p->>'slug', p->>'name', nullif(p->>'description', ''), nullif(p->>'category_id', '')::uuid,
      array(select jsonb_array_elements_text(p->'highlights')),
      array(select jsonb_array_elements_text(p->'pros')),
      array(select jsonb_array_elements_text(p->'cons')),
      coalesce(p->'specs', '[]'::jsonb), nullif(p->>'badge', ''),
      coalesce((p->>'is_featured')::boolean, false), coalesce((p->>'sort_order')::int, 0), coalesce((p->>'is_active')::boolean, true)
    )
    returning id into pid;
  else
    update products set
      slug = p->>'slug', name = p->>'name', description = nullif(p->>'description', ''),
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

-- Duplikat produk (nonaktif, slug & nama diberi akhiran) beserta galeri dan link-nya.
create function duplicate_product(src uuid)
returns uuid
language plpgsql set search_path = public as $$
declare
  pid uuid;
begin
  insert into products (slug, name, description, category_id, highlights, pros, cons, specs, badge, is_featured, sort_order, is_active)
  select left(slug, 88) || '-salinan-' || substr(md5(random()::text), 1, 4), name || ' (salinan)', description, category_id,
         highlights, pros, cons, specs, badge, false, sort_order, false
  from products where id = src
  returning id into pid;
  if pid is null then raise exception 'product % not found', src using errcode = 'P0002'; end if;

  insert into product_images (product_id, url, alt, sort_order)
  select pid, url, alt, sort_order from product_images where product_id = src;
  insert into product_links (product_id, marketplace, url, price, original_price)
  select pid, marketplace, url, price, original_price from product_links where product_id = src;
  return pid;
end $$;

revoke execute on function save_product(jsonb)     from public, anon, authenticated;
revoke execute on function duplicate_product(uuid) from public, anon, authenticated;
