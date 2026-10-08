// Rentang tanggal dashboard dalam WIB (UTC+7). Murni, tanpa import: dites scripts/check-range.mjs.
export const DAY = 864e5;
const WIB = 7 * 3600e3;
export const CHART_ORDER = ['shopee', 'tiktok', 'tokopedia']; // urutan stack tervalidasi (dataviz)
export const PERIODS = [7, 30, 90];

// 00:00 WIB dari tanggal WIB "YYYY-MM-DD" -> Date (UTC)
export const wibMidnight = (ymd) => new Date(Date.parse(`${ymd}T00:00:00+07:00`));
export const wibYmd = (ms) => new Date(ms + WIB).toISOString().slice(0, 10);
const isYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') && !Number.isNaN(Date.parse(s));

// Rentang aktif dari searchParams: preset `days` atau custom `from`..`to` (inklusif, WIB).
export function resolveRange({ days, from, to } = {}, now = Date.now()) {
  const today = wibYmd(now);
  if (isYmd(from) && isYmd(to) && from <= to) {
    return { mode: 'custom', from, to, since: wibMidnight(from), until: new Date(wibMidnight(to).getTime() + DAY) };
  }
  const n = PERIODS.includes(Number(days)) ? Number(days) : 30;
  const fromYmd = wibYmd(wibMidnight(today).getTime() - (n - 1) * DAY);
  return { mode: 'preset', days: n, from: fromYmd, to: today, since: wibMidnight(fromYmd), until: new Date(now) };
}

