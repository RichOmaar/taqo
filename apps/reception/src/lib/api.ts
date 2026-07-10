import type {
  EntryActionResponse,
  GetRestaurantResponse,
  ListQueueEntriesResponse,
} from '@nexa/types';

import { authHeader } from './auth';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function getRestaurant(code: string): Promise<GetRestaurantResponse> {
  const res = await fetch(`${API_URL}/restaurants/${code}`);
  if (!res.ok) throw new Error(`Failed to load restaurant (${res.status})`);
  return res.json() as Promise<GetRestaurantResponse>;
}

export async function listQueueEntries(
  restaurantId: string,
  queueId: string,
): Promise<ListQueueEntriesResponse> {
  const res = await fetch(`${API_URL}/restaurants/${restaurantId}/queues/${queueId}/entries`);
  if (!res.ok) throw new Error(`Failed to load entries (${res.status})`);
  return res.json() as Promise<ListQueueEntriesResponse>;
}

async function entryAction(entryId: string, action: string): Promise<EntryActionResponse> {
  const res = await fetch(`${API_URL}/entries/${entryId}/${action}`, {
    method: 'POST',
    headers: authHeader(),
  });
  if (!res.ok) throw new Error(`Action "${action}" failed (${res.status})`);
  return res.json() as Promise<EntryActionResponse>;
}

export const notifyEntry = (id: string) => entryAction(id, 'notify');
export const seatEntry = (id: string) => entryAction(id, 'seat');
export const noShowEntry = (id: string) => entryAction(id, 'no-show');
