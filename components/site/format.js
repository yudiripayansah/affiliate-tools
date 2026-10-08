// Formatter & label bersama storefront (murni, aman di server & client).
export const rupiah = (n) =>
  n == null ? '' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export const MARKET_LABEL = { shopee: 'Shopee', tokopedia: 'Tokopedia', tiktok: 'TikTok Shop' };
export const BADGE_LABEL = { terlaris: 'Terlaris', promo: 'Promo', pilihan_editor: 'Pilihan Editor', baru: 'Baru' };

export const longDate = (iso) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso));
