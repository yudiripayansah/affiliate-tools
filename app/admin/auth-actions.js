'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, SESSION_MAX_AGE, checkPassword, createSessionToken } from '@/lib/session';

// Hanya izinkan redirect balik ke dalam /admin (cegah open redirect lewat ?next=).
const safeNext = (next) => (typeof next === 'string' && /^\/admin(\/|\?|$)/.test(next) ? next : '/admin');

export async function login(formData) {
  const next = safeNext(formData.get('next'));

  if (!checkPassword(formData.get('password'))) {
    // ponytail: jeda tetap memperlambat tebak-tebakan password; rate limit per IP bila admin diserang
    await new Promise((r) => setTimeout(r, 800));
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: SESSION_MAX_AGE,
  });
  redirect(next);
}

export async function logout() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: '/admin' });
  redirect('/admin/login');
}
