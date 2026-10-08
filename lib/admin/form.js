// Helper parsing & validasi FormData untuk Server Action admin.

export const slugify = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);

export const text = (fd, key) => String(fd.get(key) ?? '').trim();
export const optText = (fd, key) => text(fd, key) || null;
export const int = (fd, key, fallback = 0) => {
  const n = Number.parseInt(text(fd, key), 10);
  return Number.isFinite(n) ? n : fallback;
};
// Dari <input type="number">: "249000" / "249000.5" ; kosong -> null ; invalid/negatif -> NaN
export const money = (fd, key) => {
  const raw = text(fd, key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};
// Satu item per baris, baris kosong dibuang.
export const lines = (fd, key) => text(fd, key).split('\n').map((l) => l.trim()).filter(Boolean);
export const bool = (fd, key) => fd.get(key) === 'on';

export const isHttpsUrl = (s) => /^https:\/\/[^\s]+$/.test(s);
export const SLUG_RE = /^[a-z0-9-]{1,100}$/;

// Terjemahkan error Postgres yang umum ke pesan yang bisa dibaca admin.
export function dbErrorMessage(error) {
  if (error?.code === '23505') return 'Slug sudah dipakai. Gunakan slug lain.';
  if (error?.code === '23514') return 'Ada nilai yang tidak valid (cek URL https://, harga, atau tanggal).';
  if (error?.code === '23503') return 'Data ini masih dipakai oleh data lain.';
  return 'Gagal menyimpan. Coba lagi.';
}

// <input type="datetime-local"> tidak membawa zona waktu; admin selalu memakai WIB (UTC+7).
// "2026-10-10T08:00" -> "2026-10-10T08:00:00+07:00" ; kosong -> null ; invalid -> NaN
export const wibDate = (fd, key) => {
  const raw = text(fd, key);
  if (!raw) return null;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw) && !Number.isNaN(Date.parse(`${raw}:00+07:00`)) ? `${raw}:00+07:00` : NaN;
};
// ISO dari DB -> nilai untuk datetime-local dalam WIB.
export const toWibInput = (iso) => (iso ? new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 16) : '');
