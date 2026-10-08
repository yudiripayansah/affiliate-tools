-- ================= Phase 2 (B7): import produk massal =================
-- items = jsonb array payload save_product. Setiap item diproses dalam sub-transaksi sendiri:
-- item yang gagal tidak membatalkan item lain. Mengembalikan hasil per slug.
create function import_products(items jsonb)
returns table (slug text, product_id uuid, error text)
language plpgsql set search_path = public as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(items) loop
    slug := item->>'slug';
    begin
      product_id := save_product(item);
      error := null;
    exception when others then
      product_id := null;
      error := sqlerrm;
    end;
    return next;
  end loop;
end $$;

revoke execute on function import_products(jsonb) from public, anon, authenticated;
