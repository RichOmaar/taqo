'use client';

import { useSession } from '@nexa/api-client/react';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

/**
 * Gates a page on an authenticated staff session.
 *
 * Waits for `unknown` to resolve before redirecting: the session is restored
 * asynchronously, so acting on the initial state would bounce a signed-in user
 * to the login screen on every reload.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="font-body text-muted">Cargando…</p>
      </main>
    );
  }

  return <>{children}</>;
}
