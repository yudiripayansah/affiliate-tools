'use server';

import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { TAGS } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin/auth';

// Untuk perubahan data di luar admin (SQL Editor, skrip): paksa storefront memuat data terbaru.
export async function refreshSiteCache() {
  await requireAdmin();
  Object.values(TAGS).forEach((t) => updateTag(t));
  redirect(`/admin?msg=${encodeURIComponent('Data situs disegarkan')}`);
}
