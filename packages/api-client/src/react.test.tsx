import type { Restaurant, StaffUser } from '@nexa/types';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SessionProvider, useApi, useSession } from './react';
import type { SessionStorage } from './session';

const USER: StaffUser = {
  id: 'u1',
  restaurantId: 'r1',
  email: 'owner@demo.nexa',
  name: 'Dueño Demo',
  role: 'admin',
};

const RESTAURANT: Restaurant = {
  id: 'r1',
  name: 'Bistro Moderno',
  code: 'DEMO',
  qrToken: 'demo-qr-token',
  etaBaseMinutes: 10,
  expirationMinutes: 10,
  plan: 'free',
  timezone: 'America/Mexico_City',
  createdAt: '2026-07-01T00:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fakeStorage(initial?: string): SessionStorage {
  const values = new Map<string, string>();
  if (initial) values.set('nexa_token', initial);
  return {
    get: (k) => values.get(k) ?? null,
    set: (k, v) => void values.set(k, v),
    remove: (k) => void values.delete(k),
  };
}

function stubFetch(me?: Response) {
  return vi
    .fn<typeof globalThis.fetch>()
    .mockImplementation(() =>
      Promise.resolve((me ?? jsonResponse({ user: USER, restaurant: RESTAURANT })).clone()),
    );
}

/** Renders the session as text so assertions read off the DOM. */
function Probe() {
  const session = useSession();
  return (
    <div>
      <span data-testid="status">{session.status}</span>
      <span data-testid="restaurant">{session.restaurant?.code ?? '-'}</span>
      <span data-testid="error">{session.error ?? '-'}</span>
    </div>
  );
}

describe('SessionProvider', () => {
  it('restores an existing session on mount', async () => {
    render(
      <SessionProvider
        baseUrl="http://api.test"
        storage={fakeStorage('tok_saved')}
        fetch={stubFetch()}
      >
        <Probe />
      </SessionProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('restaurant')).toHaveTextContent('DEMO');
  });

  it('settles on anonymous when there is no stored token', async () => {
    render(
      <SessionProvider baseUrl="http://api.test" storage={fakeStorage()}>
        <Probe />
      </SessionProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
  });

  it('falls back to anonymous and reports why when the API is unreachable', async () => {
    // Otherwise a guard would spin on `unknown` forever.
    const fetch = stubFetch(jsonResponse({ error: { code: 'boom', message: 'db down' } }, 500));

    render(
      <SessionProvider baseUrl="http://api.test" storage={fakeStorage('tok_saved')} fetch={fetch}>
        <Probe />
      </SessionProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(screen.getByTestId('error')).toHaveTextContent('db down');
  });

  it('throws a useful error when used outside the provider', () => {
    // React logs the error boundary trace; silence it for this assertion.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Probe />)).toThrow(/inside a <SessionProvider>/);

    spy.mockRestore();
  });

  it('exposes the api client bound to the session', async () => {
    let seen: unknown = null;
    function ApiProbe() {
      seen = useApi();
      return null;
    }

    render(
      <SessionProvider baseUrl="http://api.test" storage={fakeStorage()}>
        <ApiProbe />
      </SessionProvider>,
    );

    await waitFor(() => expect(seen).not.toBeNull());
    expect(seen).toHaveProperty('restaurants');
  });
});
