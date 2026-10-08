// proxy.js (root proyek) — lindungi /admin/* dengan session cookie (lib/session.js) + redirect URL kategori lama.
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

export function proxy(req) {
  const { pathname, search, searchParams } = req.nextUrl;

  // URL kategori lama Phase 1: /?c=slug -> /c/slug (permanen, tanpa membawa query lama).
  if (pathname === '/') {
    const c = searchParams.get('c') ?? '';
    return NextResponse.redirect(new URL(/^[a-z0-9-]{1,100}$/.test(c) ? `/c/${c}` : '/', req.url), 308);
  }

  // Slug kategori lama (Phase 3 restruktur kategori).
  const moved = { '/c/rumah-tangga': '/c/elektronik-rumah' }[pathname];
  if (moved) return NextResponse.redirect(new URL(moved + search, req.url), 308);

  if (pathname === '/admin/login') return NextResponse.next();

  if (verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  const login = new URL('/admin/login', req.url);
  login.searchParams.set('next', pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/admin/:path*', '/c/rumah-tangga', { source: '/', has: [{ type: 'query', key: 'c' }] }],
};
