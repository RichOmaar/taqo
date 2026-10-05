import type { Restaurant, StaffUser } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { createNexaSession, type SessionStorage } from './session';

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

/** Routes by path: sign-in returns the token header, /me returns the session. */
function stubFetch(overrides: { signIn?: Response; me?: Response } = {}) {
  return vi.fn<typeof globalThis.fetch>().mockImplementation((input) => {
    const url = String(input);
    if (url.endsWith('/api/auth/sign-in/email')) {
      return Promise.resolve(
        (
          overrides.signIn ?? new Response('{}', { headers: { 'set-auth-token': 'tok_abc' } })
        ).clone(),
      );
    }
    if (url.endsWith('/me')) {
      return Promise.resolve(
        (overrides.me ?? jsonResponse({ user: USER, restaurant: RESTAURANT })).clone(),
      );
    }
    return Promise.resolve(jsonResponse({}, 404));
  });
}

function build(options: { storage?: SessionStorage; fetch?: typeof globalThis.fetch } = {}) {
  return createNexaSession({
    baseUrl: 'http://api.test',
    storage: options.storage ?? fakeStorage(),
    fetch: options.fetch ?? stubFetch(),
  });
}

describe('createNexaSession', () => {
  it('starts in unknown so a guard does not redirect before restore', () => {
    const { store } = build();

    expect(store.getState().status).toBe('unknown');
  });

  describe('signIn', () => {
    it('stores the user and their restaurant', async () => {
      const { store } = build();

      await store.getState().signIn('owner@demo.nexa', 'pw');

      expect(store.getState()).toMatchObject({
        status: 'authenticated',
        user: USER,
        restaurant: RESTAURANT,
      });
    });

    it('persists the token so a reload can restore', async () => {
      const storage = fakeStorage();
      const { store } = build({ storage });

      await store.getState().signIn('owner@demo.nexa', 'pw');

      expect(storage.get('nexa_token')).toBe('tok_abc');
    });

    it('sends the token on the follow-up /me call', async () => {
      const fetch = stubFetch();
      const { store } = build({ fetch });

      await store.getState().signIn('owner@demo.nexa', 'pw');

      const meCall = fetch.mock.calls.find(([url]) => String(url).endsWith('/me'));
      expect(meCall?.[1]?.headers).toMatchObject({ Authorization: 'Bearer tok_abc' });
    });

    it('records the error and stays anonymous on bad credentials', async () => {
      const fetch = stubFetch({ signIn: new Response('{}', { status: 401 }) });
      const { store } = build({ fetch });

      await expect(store.getState().signIn('a@b.c', 'bad')).rejects.toThrow();

      expect(store.getState()).toMatchObject({ status: 'anonymous', user: null, pending: false });
      expect(store.getState().error).toBeTruthy();
    });

    it('does not persist a token when sign-in fails', async () => {
      const storage = fakeStorage();
      const fetch = stubFetch({ signIn: new Response('{}', { status: 401 }) });
      const { store } = build({ storage, fetch });

      await store
        .getState()
        .signIn('a@b.c', 'bad')
        .catch(() => undefined);

      expect(storage.get('nexa_token')).toBeNull();
    });
  });

  describe('restore', () => {
    it('goes anonymous when no token is persisted', async () => {
      const { store } = build();

      await store.getState().restore();

      expect(store.getState().status).toBe('anonymous');
    });

    it('rebuilds the session from a persisted token', async () => {
      const { store } = build({ storage: fakeStorage('tok_saved') });

      await store.getState().restore();

      expect(store.getState()).toMatchObject({
        status: 'authenticated',
        user: USER,
        restaurant: RESTAURANT,
      });
    });

    it('clears a stale token instead of surfacing an error', async () => {
      const storage = fakeStorage('tok_expired');
      const fetch = stubFetch({
        me: jsonResponse({ error: { code: 'unauthorized', message: 'no' } }, 401),
      });
      const { store } = build({ storage, fetch });

      await store.getState().restore();

      expect(store.getState().status).toBe('anonymous');
      expect(storage.get('nexa_token')).toBeNull();
    });

    it('propagates non-auth failures rather than silently signing out', async () => {
      const fetch = stubFetch({
        me: jsonResponse({ error: { code: 'boom', message: 'db down' } }, 500),
      });
      const { store } = build({ storage: fakeStorage('tok_saved'), fetch });

      await expect(store.getState().restore()).rejects.toThrow();
    });
  });

  it('signOut clears the session and the persisted token', async () => {
    const storage = fakeStorage();
    const { store } = build({ storage });
    await store.getState().signIn('owner@demo.nexa', 'pw');

    store.getState().signOut();

    expect(store.getState()).toMatchObject({ status: 'anonymous', user: null, restaurant: null });
    expect(storage.get('nexa_token')).toBeNull();
  });

  it('stops sending the token after signOut', async () => {
    const fetch = stubFetch();
    const { store, api } = build({ fetch });
    await store.getState().signIn('owner@demo.nexa', 'pw');
    store.getState().signOut();
    fetch.mockClear();

    await api.auth.me().catch(() => undefined);

    expect(fetch.mock.calls[0]?.[1]?.headers).not.toHaveProperty('Authorization');
  });
});
