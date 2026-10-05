import type { GetRestaurantResponse, ListQueueEntriesResponse } from '@nexa/types';

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
