import type { GetRestaurantResponse, JoinWaitlistResponse } from '@nexa/types';
import { inject } from 'vitest';

export const base = inject('baseUrl');

/** A trusted dev origin; BetterAuth rejects sign-in from anywhere else. */
const ORIGIN = 'http://localhost:3003';

/** Signed in once and reused: a sign-in per test trips the auth rate limit. */
let cachedToken: Promise<string> | null = null;

export function staffToken(): Promise<string> {
  cachedToken ??= (async () => {
    const res = await fetch(`${base}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ email: 'owner@demo.nexa', password: 'ownerpass123' }),
    });
    const token = res.headers.get('set-auth-token');
    if (!token) throw new Error(`no staff token (${res.status})`);
    return token;
  })();
  return cachedToken;
}

export async function generalQueueId(): Promise<string> {
  const data = (await (await fetch(`${base}/restaurants/DEMO`)).json()) as GetRestaurantResponse;
  const general = data.queues.find((queue) => queue.name === 'General');
  if (!general) throw new Error('no General queue');
  return general.id;
}

export async function join(queueId: string, displayName: string): Promise<string> {
  const res = await fetch(`${base}/restaurants/DEMO/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queueId, displayName, partySize: 2 }),
  });
  return ((await res.json()) as JoinWaitlistResponse).entry.id;
}

export async function getJson<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${path} failed (${res.status})`);
  return (await res.json()) as T;
}

/** Seats an entry and leaves a review on it, so reads have something to find. */
export async function seatAndReview(
  entryId: string,
  token: string,
  rating: number,
  feedback: string | null,
): Promise<void> {
  await fetch(`${base}/entries/${entryId}/seat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  await fetch(`${base}/entries/${entryId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, feedback }),
  });
}
