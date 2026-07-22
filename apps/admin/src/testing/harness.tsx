import { SessionProvider } from '@nexa/api-client/react';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

const BASE_URL = 'http://api.test';

export const RESTAURANT = {
  id: 'rest-1',
  code: 'DEMO',
  name: 'Demo',
  timezone: 'America/Mexico_City',
  baseWaitMinutes: 15,
  expirationMinutes: 10,
  plan: 'free',
};

/**
 * A route table: `'METHOD /path'` → the JSON body to answer with, or a
 * function of the request for anything that has to react to what was sent.
 */
export type Routes = Record<string, unknown | ((request: RouteRequest) => unknown)>;

export interface RouteRequest {
  method: string;
  path: string;
  body: unknown;
}

/** Requests the harness answered, in order. Assert against this. */
export type RecordedCall = RouteRequest;

export interface Harness {
  calls: RecordedCall[];
  /** Answers made after mount, e.g. to change what a later save returns. */
  setRoutes: (routes: Routes) => void;
}

/**
 * Renders an admin page against a fake API.
 *
 * The page is rendered exactly as the app renders it — through SessionProvider
 * and the real API client — so what is under test is the page and its wiring,
 * not a hand-rolled stand-in for either.
 */
export function renderAdmin(ui: ReactElement, initialRoutes: Routes = {}): Harness {
  let routes: Routes = {
    'GET /me': { user: { id: 'u1', name: 'Dueña', email: 'owner@demo.nexa' }, restaurant: RESTAURANT },
    ...initialRoutes,
  };
  const calls: RecordedCall[] = [];

  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input.toString());
    const method = (init?.method ?? 'GET').toUpperCase();
    const path = url.pathname;
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;

    calls.push({ method, path, body });

    const key = `${method} ${path}`;
    const answer = routes[key];

    if (answer === undefined) {
      // Loud on purpose: a page quietly calling an unstubbed endpoint is
      // exactly the wiring bug these tests exist to catch.
      return jsonResponse({ error: { code: 'no_stub', message: `No stub for ${key}` } }, 404);
    }

    const resolved = typeof answer === 'function' ? answer({ method, path, body }) : answer;
    if (resolved instanceof Error) {
      return jsonResponse(
        { error: { code: 'test_error', message: resolved.message } },
        400,
      );
    }

    return jsonResponse(resolved, 200);
  }) as unknown as typeof globalThis.fetch;

  const storage = {
    get: () => 'test-token',
    set: () => undefined,
    remove: () => undefined,
  };

  render(
    <SessionProvider baseUrl={BASE_URL} storage={storage} fetch={fetchImpl}>
      {ui}
    </SessionProvider>,
  );

  return {
    calls,
    setRoutes: (next) => {
      routes = { ...routes, ...next };
    },
  };
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
