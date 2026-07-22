import { describe, expect, it, vi } from 'vitest';

import { createApiClient } from './client';
import { ApiRequestError } from './errors';

/** Each call gets a clone, since a Response body can only be read once. */
function stubFetch(response: Response) {
  return vi
    .fn<typeof globalThis.fetch>()
    .mockImplementation(() => Promise.resolve(response.clone()));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** URL of the first fetch call. */
function calledUrl(fetch: ReturnType<typeof stubFetch>): string {
  return String(fetch.mock.calls[0]![0]);
}

describe('createApiClient', () => {
  it('maps restaurant reads to their endpoints', async () => {
    const fetch = stubFetch(jsonResponse({ restaurant: {}, queues: [] }));
    const api = createApiClient({ baseUrl: 'http://api.test', fetch });

    await api.restaurants.get('DEMO');

    expect(calledUrl(fetch)).toBe('http://api.test/restaurants/DEMO');
  });

  it('encodes path segments so codes cannot break out of the path', async () => {
    const fetch = stubFetch(jsonResponse({}));
    const api = createApiClient({ baseUrl: 'http://api.test', fetch });

    await api.restaurants.get('a/../b?x=1');

    expect(calledUrl(fetch)).toBe('http://api.test/restaurants/a%2F..%2Fb%3Fx%3D1');
  });

  it('sends the token on staff-only calls', async () => {
    const fetch = stubFetch(jsonResponse({ metrics: {} }));
    const api = createApiClient({ baseUrl: 'http://api.test', fetch, getToken: () => 'tok' });

    await api.restaurants.metrics('DEMO');

    expect(fetch.mock.calls[0]![1]?.headers).toMatchObject({ Authorization: 'Bearer tok' });
  });

  it('does not send the token on public calls', async () => {
    const fetch = stubFetch(jsonResponse({ restaurants: [] }));
    const api = createApiClient({ baseUrl: 'http://api.test', fetch, getToken: () => 'tok' });

    await api.restaurants.list();

    expect(fetch.mock.calls[0]![1]?.headers).not.toHaveProperty('Authorization');
  });

  it('maps the no-show action to its hyphenated path', async () => {
    const fetch = stubFetch(jsonResponse({ entry: {} }));
    const api = createApiClient({ baseUrl: 'http://api.test', fetch });

    await api.entries.markNoShow('e1');

    expect(calledUrl(fetch)).toBe('http://api.test/entries/e1/no-show');
  });

  describe('signInWithEmail', () => {
    it('returns the token from the set-auth-token header', async () => {
      const fetch = stubFetch(
        new Response('{}', { status: 200, headers: { 'set-auth-token': 'tok_abc' } }),
      );
      const api = createApiClient({ baseUrl: 'http://api.test', fetch });

      await expect(api.auth.signInWithEmail('owner@demo.nexa', 'pw')).resolves.toBe('tok_abc');
      expect(calledUrl(fetch)).toBe('http://api.test/api/auth/sign-in/email');
    });

    it('rejects with invalid_credentials on a failed sign-in', async () => {
      const fetch = stubFetch(new Response('{}', { status: 401 }));
      const api = createApiClient({ baseUrl: 'http://api.test', fetch });

      const error = await api.auth.signInWithEmail('a@b.c', 'bad').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiRequestError);
      expect(error).toMatchObject({ code: 'invalid_credentials' });
    });

    it('rejects when the response carries no token', async () => {
      const fetch = stubFetch(new Response('{}', { status: 200 }));
      const api = createApiClient({ baseUrl: 'http://api.test', fetch });

      const error = await api.auth.signInWithEmail('a@b.c', 'pw').catch((e: unknown) => e);

      expect(error).toMatchObject({ code: 'missing_token' });
    });
  });
});
