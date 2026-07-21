import type { Restaurant, StaffUser } from '@nexa/types';
import { createStore, type StoreApi } from 'zustand/vanilla';

import { createApiClient, type NexaApiClient } from './client';
import { isApiRequestError } from './errors';
import type { HttpClientOptions } from './http';

const TOKEN_KEY = 'nexa_token';

/** Where the bearer token is persisted between reloads. */
export interface SessionStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** No-op storage so the store is safe to construct during SSR. */
function memoryStorage(): SessionStorage {
  const values = new Map<string, string>();
  return {
    get: (key) => values.get(key) ?? null,
    set: (key, value) => {
      values.set(key, value);
    },
    remove: (key) => {
      values.delete(key);
    },
  };
}

/** The slice of the Web Storage API this package needs. */
interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Uses localStorage when the runtime has it, memory otherwise.
 *
 * Feature-detected off globalThis rather than typeof window, so the package
 * type-checks without the DOM lib — it runs server-side too.
 */
function defaultStorage(): SessionStorage {
  const storage = (globalThis as { localStorage?: WebStorageLike }).localStorage;
  if (!storage) return memoryStorage();
  return {
    get: (key) => storage.getItem(key),
    set: (key, value) => storage.setItem(key, value),
    remove: (key) => storage.removeItem(key),
  };
}

/**
 * `unknown` until `restore()` has run, so a guard can tell "not signed in"
 * apart from "we have not looked yet" and avoid redirecting on first paint.
 */
export type SessionStatus = 'unknown' | 'anonymous' | 'authenticated';

export interface SessionState {
  status: SessionStatus;
  user: StaffUser | null;
  /** The restaurant this staff user manages; the app never hardcodes a code. */
  restaurant: Restaurant | null;
  /** Set when the last sign-in attempt failed. */
  error: string | null;
  pending: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): void;
  /** Re-establishes a session from the persisted token. Safe to call twice. */
  restore(): Promise<void>;
}

export interface SessionOptions extends Pick<HttpClientOptions, 'baseUrl' | 'fetch'> {
  storage?: SessionStorage;
}

export interface NexaSession {
  store: StoreApi<SessionState>;
  /** Client bound to this session; authenticated calls carry its token. */
  api: NexaApiClient;
}

/**
 * Session store plus the API client bound to it.
 *
 * The token lives in a closure that the HTTP client reads on every request, so
 * there is exactly one source of truth; the store mirrors it for rendering.
 * Framework-agnostic on purpose — React binds to it with `useStore`.
 */
export function createNexaSession(options: SessionOptions): NexaSession {
  const storage = options.storage ?? defaultStorage();
  let token: string | null = storage.get(TOKEN_KEY);

  const api = createApiClient({
    baseUrl: options.baseUrl,
    fetch: options.fetch,
    getToken: () => token,
  });

  const store = createStore<SessionState>((set) => {
    function clear(): void {
      token = null;
      storage.remove(TOKEN_KEY);
      set({ status: 'anonymous', user: null, restaurant: null });
    }

    /** Loads /me into the store; clears the session if the token is stale. */
    async function loadCurrentStaff(): Promise<void> {
      try {
        const { user, restaurant } = await api.auth.me();
        set({ status: 'authenticated', user, restaurant, error: null });
      } catch (error) {
        // A rejected token is not an app error, it just means "signed out".
        if (isApiRequestError(error) && error.isAuthError) {
          clear();
          return;
        }
        throw error;
      }
    }

    return {
      status: 'unknown',
      user: null,
      restaurant: null,
      error: null,
      pending: false,

      async signIn(email, password) {
        set({ pending: true, error: null });
        try {
          token = await api.auth.signInWithEmail(email, password);
          storage.set(TOKEN_KEY, token);
          await loadCurrentStaff();
        } catch (error) {
          clear();
          set({
            error: isApiRequestError(error) ? error.message : 'No se pudo iniciar sesión',
          });
          throw error;
        } finally {
          set({ pending: false });
        }
      },

      signOut() {
        clear();
      },

      async restore() {
        if (!token) {
          set({ status: 'anonymous' });
          return;
        }
        set({ pending: true });
        try {
          await loadCurrentStaff();
        } finally {
          set({ pending: false });
        }
      },
    };
  });

  return { store, api };
}
