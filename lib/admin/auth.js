// Penjaga untuk setiap Server Action admin. proxy.js hanya menjaga navigasi halaman;
// Server Action bisa dipanggil lewat POST, jadi tetap dicek di sini.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

export async function requireAdmin() {
  if (!verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)) redirect('/admin/login');
}
