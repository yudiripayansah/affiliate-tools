'use server';

import { updateTag } from 'next/cache';
import { db, TAGS } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin/auth';
import { analyzeCsv } from '@/lib/admin/csv';
import { loadImportContext } from '@/lib/admin/import';

const MAX_BYTES = 5 * 1024 * 1024;
const BATCH = 200;

// Pratinjau: validasi semua baris tanpa menulis apa pun.
export async function previewImport(text) {
  await requireAdmin();
  if (typeof text !== 'string' || text.length > MAX_BYTES) return { fatal: 'File terlalu besar (maks 5 MB).' };
  const analysis = analyzeCsv(text, await loadImportContext());
  if (analysis.fatal) return analysis;
  // Kirim balik ringkas: tanpa payload.
  return { ...analysis, results: analysis.results.map(({ payload, ...r }) => r) };
}

// Simpan baris valid. CSV dianalisis ulang di server (jangan percaya hasil pratinjau dari client).
export async function commitImport(text) {
  await requireAdmin();
  if (typeof text !== 'string' || text.length > MAX_BYTES) return { fatal: 'File terlalu besar (maks 5 MB).' };
  const analysis = analyzeCsv(text, await loadImportContext());
  if (analysis.fatal) return analysis;

  const valid = analysis.results.filter((r) => r.payload);
  const failed = [];
  let saved = 0;
  for (let i = 0; i < valid.length; i += BATCH) {
    const chunk = valid.slice(i, i + BATCH);
    const { data, error } = await db.rpc('import_products', { items: chunk.map((r) => r.payload) });
    if (error) {
      failed.push(...chunk.map((r) => ({ line: r.line, slug: r.slug, error: 'Batch gagal disimpan' })));
      continue;
    }
    for (const row of data) {
      if (row.error) failed.push({ line: chunk.find((r) => r.slug === row.slug)?.line, slug: row.slug, error: row.error });
      else saved += 1;
    }
  }

  if (saved) updateTag(TAGS.products);
  return { saved, skipped: analysis.summary.error, failed };
}
