// Client Supabase server-only (service role, bypass RLS). JANGAN import dari Client Component.
// SUPABASE_SERVICE_ROLE_KEY tidak ber-prefix NEXT_PUBLIC_, jadi tidak pernah masuk bundle browser.
import { createClient } from '@supabase/supabase-js';

export const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const MARKETPLACES = ['shopee', 'tokopedia', 'tiktok'];
export const MARKETPLACE_LABEL = { shopee: 'Shopee', tokopedia: 'Tokopedia', tiktok: 'TikTok Shop' };

// Tag cache storefront; Server Action admin memanggil updateTag(TAGS.x) setelah menulis.
export const TAGS = { products: 'products', categories: 'categories', banners: 'banners', pages: 'pages' };
