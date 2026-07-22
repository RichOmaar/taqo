import { describe, expect, it, vi } from 'vitest';

import { ApiRequestError } from './errors';
import { createHttpClient } from './http';

/**
 * Builds a fetch stub that records its calls and answers with `response`.
 * Each call gets a clone, since a Response body can only be read once.
 */
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

describe('createHttpClient', () => {
  it('resolves the JSON body of a successful request', async () => {
    const fetch = stubFetch(jsonResponse({ ok: true }));
    const client = createHttpClient({ baseUrl: 'http://api.test', fetch });

    await expect(client.request('/health')).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      'http://api.test/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('strips a trailing slash from the base URL', async () => {
    const fetch = stubFetch(jsonResponse({}));
    const client = createHttpClient({ baseUrl: 'http://api.test/', fetch });

    await client.request('/health');

    expect(fetch).toHaveBeenCalledWith('http://api.test/health', expect.anything());
  });

  it('sends a JSON body and content type when a body is given', async () => {
    const fetch = stubFetch(jsonResponse({}));
    const client = createHttpClient({ baseUrl: 'http://api.test', fetch });

    await client.request('/things', { method: 'POST', body: { name: 'x' } });

    const [, init] = fetch.mock.calls[0]!;
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"name":"x"}');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('omits the body and content type for bodyless requests', async () => {
    const fetch = stubFetch(jsonResponse({}));
    const client = createHttpClient({ baseUrl: 'http://api.test', fetch });

    await client.request('/things', { method: 'POST' });

    const [, init] = fetch.mock.calls[0]!;
    expect(init?.body).toBeUndefined();
    expect(init?.headers).not.toHaveProperty('Content-Type');
  });

  it('attaches the bearer token only when auth is requested', async () => {
    const fetch = stubFetch(jsonResponse({}));
    const client = createHttpClient({
      baseUrl: 'http://api.test',
      fetch,
      getToken: () => 'tok_123',
    });

    await client.request('/public');
    await client.request('/private', { auth: true });

    expect(fetch.mock.calls[0]![1]?.headers).not.toHaveProperty('Authorization');
    expect(fetch.mock.calls[1]![1]?.headers).toMatchObject({ Authorization: 'Bearer tok_123' });
  });

  it('omits the header when auth is requested but no token exists', async () => {
    const fetch = stubFetch(jsonResponse({}));
    const client = createHttpClient({ baseUrl: 'http://api.test', fetch, getToken: () => null });

    await client.request('/private', { auth: true });

    expect(fetch.mock.calls[0]![1]?.headers).not.toHaveProperty('Authorization');
  });

  it('returns undefined for 204 responses instead of parsing a body', async () => {
    const fetch = stubFetch(new Response(null, { status: 204 }));
    const client = createHttpClient({ baseUrl: 'http://api.test', fetch });

    await expect(client.request('/things/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws ApiRequestError carrying the API error envelope', async () => {
    const fetch = stubFetch(
      jsonResponse({ error: { code: 'queue_closed', message: 'La cola está cerrada' } }, 409),
    );
    const client = createHttpClient({ baseUrl: 'http://api.test', fetch });

    const error = await client.request('/things').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 409,
      code: 'queue_closed',
      message: 'La cola está cerrada',
    });
  });

  it('falls back to a generic error when the body is not the envelope', async () => {
    const fetch = stubFetch(new Response('<html>502</html>', { status: 502 }));
    const client = createHttpClient({ baseUrl: 'http://api.test', fetch });

    const error = await client.request('/things').catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 502, code: 'unknown_error' });
  });

  it('flags 401 and 403 as auth errors', async () => {
    const fetch = stubFetch(jsonResponse({ error: { code: 'unauthorized', message: 'no' } }, 401));
    const client = createHttpClient({ baseUrl: 'http://api.test', fetch });

    const error = (await client.request('/private').catch((e: unknown) => e)) as ApiRequestError;

    expect(error.isAuthError).toBe(true);
  });
});
