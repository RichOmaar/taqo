import type {
  EntryAddedPayload,
  EntryRemovedPayload,
  EntryUpdatedPayload,
  GetEntryResponse,
  GetRestaurantResponse,
  JoinWaitlistResponse,
} from '@nexa/types';
import { io } from 'socket.io-client';
import { describe, expect, inject, it } from 'vitest';

const base = inject('baseUrl');
const ORIGIN = 'http://localhost:3003';

async function staffToken(): Promise<string> {
  const res = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ email: 'owner@demo.nexa', password: 'ownerpass123' }),
  });
  const token = res.headers.get('set-auth-token');
  if (!token) throw new Error('no staff token');
  return token;
}

async function generalQueue(): Promise<{ restaurantId: string; queueId: string }> {
  const data = (await (await fetch(`${base}/restaurants/DEMO`)).json()) as GetRestaurantResponse;
  const general = data.queues.find((q) => q.name === 'General');
  if (!general) throw new Error('no General queue');
  return { restaurantId: data.restaurant.id, queueId: general.id };
}

async function join(queueId: string, displayName: string): Promise<JoinWaitlistResponse['entry']> {
  const res = await fetch(`${base}/restaurants/DEMO/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queueId, displayName, partySize: 2 }),
  });
  return ((await res.json()) as JoinWaitlistResponse).entry;
}

function once<T>(socket: ReturnType<typeof io>, event: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), 8000);
    socket.on(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describe('waitlist end-to-end', () => {
  it('a guest joins and reads back the entry', async () => {
    const { queueId } = await generalQueue();
    const entry = await join(queueId, 'E2E Guest');
    expect(entry.status).toBe('waiting');
    const got = (await (await fetch(`${base}/entries/${entry.id}`)).json()) as GetEntryResponse;
    expect(got.entry.id).toBe(entry.id);
  });

  it('staff sees a join live and drives notify → seat over websocket', async () => {
    const { restaurantId, queueId } = await generalQueue();
    const token = await staffToken();
    const socket = io(base, { transports: ['websocket'], auth: { token }, reconnection: false });
    await new Promise<void>((resolve) => socket.on('connect', () => resolve()));
    socket.emit('subscribe', { restaurantId, queueId });
    await new Promise((r) => setTimeout(r, 200));

    const added = once<EntryAddedPayload>(socket, 'entry_added');
    const entry = await join(queueId, 'E2E Live');
    expect((await added).entry.id).toBe(entry.id);

    const updated = once<EntryUpdatedPayload>(socket, 'entry_updated');
    await fetch(`${base}/entries/${entry.id}/notify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect((await updated).entry.status).toBe('notified');

    const removed = once<EntryRemovedPayload>(socket, 'entry_removed');
    await fetch(`${base}/entries/${entry.id}/seat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect((await removed).entryId).toBe(entry.id);

    socket.close();
  });

  it('rejects staff actions without a token', async () => {
    const { queueId } = await generalQueue();
    const entry = await join(queueId, 'E2E NoAuth');
    const res = await fetch(`${base}/entries/${entry.id}/notify`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('a served diner submits a review', async () => {
    const { queueId } = await generalQueue();
    const token = await staffToken();
    const entry = await join(queueId, 'E2E Review');
    await fetch(`${base}/entries/${entry.id}/seat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await fetch(`${base}/entries/${entry.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, feedback: 'E2E' }),
    });
    expect(res.status).toBe(201);
  });
});
