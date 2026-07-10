import type {
  AddQueueRequest,
  GetRestaurantResponse,
  QueueResponse,
  UpdateQueueRequest,
  UpdateRestaurantConfigRequest,
} from '@nexa/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function getRestaurant(code: string): Promise<GetRestaurantResponse> {
  return fetch(`${API_URL}/restaurants/${code}`).then((r) => json<GetRestaurantResponse>(r));
}

export function updateConfig(
  code: string,
  body: UpdateRestaurantConfigRequest,
): Promise<GetRestaurantResponse> {
  return fetch(`${API_URL}/restaurants/${code}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => json<GetRestaurantResponse>(r));
}

export function addQueue(code: string, body: AddQueueRequest): Promise<GetRestaurantResponse> {
  return fetch(`${API_URL}/restaurants/${code}/queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => json<GetRestaurantResponse>(r));
}

export function updateQueue(id: string, body: UpdateQueueRequest): Promise<QueueResponse> {
  return fetch(`${API_URL}/queues/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => json<QueueResponse>(r));
}
