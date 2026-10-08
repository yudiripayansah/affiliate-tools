import { Suspense } from 'react';
import { login } from '../auth-actions';

export const metadata = { title: 'Masuk Admin', robots: { index: false } };

async function LoginForm({ searchParams }) {
  const { error, next = '/admin' } = await searchParams;

  return (
    <form action={login} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className="block text-sm font-medium">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
          className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-ink"
        />
        {error && (
          <p id="login-error" role="alert" className="mt-2 text-sm text-discount">Password salah. Coba lagi.</p>
        )}
      </div>
      <button type="submit" className="w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-ink hover:opacity-90">
        Masuk
      </button>
    </form>
  );
}

export default function LoginPage({ searchParams }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
        <p className="text-2xl font-extrabold tracking-tight">Fauqa<span className="text-brand">.</span></p>
        <h1 className="mt-1 text-sm text-muted">Masuk ke panel admin</h1>
        <Suspense fallback={<div className="mt-8 h-[9.5rem]" aria-busy="true" />}>
          <LoginForm searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
