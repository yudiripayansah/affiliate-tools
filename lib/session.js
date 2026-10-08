// Session admin: cookie berisi `<expiry>.<hmac(expiry)>`, ditandatangani ADMIN_SESSION_SECRET.
// Tanpa state di server; ganti ADMIN_SESSION_SECRET = semua session lama tidak valid.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // detik

const sign = (value) => createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(value).digest('hex');

// Bandingkan dua string dengan waktu konstan (hash dulu agar panjangnya sama).
const safeEqual = (a, b) =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

export function createSessionToken(now = Date.now()) {
  const expiry = String(now + SESSION_MAX_AGE * 1000);
  return `${expiry}.${sign(expiry)}`;
}

export function verifySessionToken(token, now = Date.now()) {
  if (!process.env.ADMIN_SESSION_SECRET || typeof token !== 'string') return false;
  const [expiry, sig] = token.split('.');
  if (!expiry || !sig || !/^\d+$/.test(expiry)) return false;
  return safeEqual(sig, sign(expiry)) && Number(expiry) > now;
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && typeof input === 'string' && safeEqual(input, expected);
}
