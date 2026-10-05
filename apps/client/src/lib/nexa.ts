import { createApiClient, createWaitlistSocket } from '@nexa/api-client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'nexa_token';

/**
 * Diner-side auth.
 *
 * Deliberately not the shared session store from @nexa/api-client: that store
 * resolves the caller's restaurant from GET /me, which is staff-only. A diner
 * is optional-auth — most arrive as guests — and belongs to no restaurant.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
}

export function signOut(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
}

export const api = createApiClient({ baseUrl: API_URL, getToken });

export async function signUp(name: string, email: string, password: string): Promise<void> {
  setToken(await api.auth.signUpWithEmail(name, email, password));
}

export async function signIn(email: string, password: string): Promise<void> {
  setToken(await api.auth.signInWithEmail(email, password));
}

/** Socket for watching a single entry. The entry id is the capability. */
export function createEntrySocket() {
  return createWaitlistSocket({ baseUrl: API_URL, getToken });
}
