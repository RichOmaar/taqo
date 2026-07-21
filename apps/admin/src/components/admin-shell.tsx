'use client';

import { useSession } from '@nexa/api-client/react';
import { AppShell, NavItem, Sidebar } from '@nexa/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { RequireSession } from './require-session';

/**
 * Information architecture for the panel.
 *
 * `enabled: false` entries are the modules still to be built. They render
 * disabled rather than being hidden, so the shape of the product is visible,
 * and rather than linking nowhere — the mocks left "Mesas" as a dead link in
 * four screens, which reads as broken.
 */
const NAV = [
  { href: '/', label: 'Panel', enabled: true },
  { href: '/lista-de-espera', label: 'Lista de espera', enabled: false },
  { href: '/resenas', label: 'Reseñas', enabled: false },
  { href: '/encuestas', label: 'Encuestas', enabled: false },
  { href: '/membresias', label: 'Membresías', enabled: false },
  { href: '/configuracion', label: 'Configuración', enabled: true },
  { href: '/plan', label: 'Plan', enabled: false },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/** The panel frame: session guard, navigation and the content column. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RequireSession>
      <Shell>{children}</Shell>
    </RequireSession>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { restaurant, signOut } = useSession();

  function logout() {
    signOut();
    router.replace('/login');
  }

  return (
    <AppShell
      sidebar={
        <Sidebar
          title={restaurant?.name ?? 'Nexa'}
          subtitle="Panel de control"
          footer={
            <NavItem as="button" label="Salir" onClick={logout} className="w-full text-left" />
          }
        >
          {NAV.map((item) =>
            item.enabled ? (
              <NavItem
                key={item.href}
                as={Link}
                href={item.href}
                label={item.label}
                active={isActive(pathname, item.href)}
              />
            ) : (
              <span
                key={item.href}
                aria-disabled="true"
                title="Próximamente"
                className="flex shrink-0 cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 font-body text-sm font-semibold text-muted opacity-50"
              >
                {item.label}
              </span>
            ),
          )}
        </Sidebar>
      }
    >
      {children}
    </AppShell>
  );
}
