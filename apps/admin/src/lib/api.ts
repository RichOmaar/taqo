import type {
  AddQueueRequest,
  GetMetricsResponse,
  GetRestaurantResponse,
  QueueResponse,
  UpdateQueueRequest,
  UpdateRestaurantConfigRequest,
} from '@nexa/types';

import { authHeader } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function jsonHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', ...authHeader() };
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function getMetrics(code: string): Promise<GetMetricsResponse> {
  return fetch(`${API_URL}/restaurants/${code}/metrics`, { headers: authHeader() }).then((r) =>
    json<GetMetricsResponse>(r),
  );
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
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  }).then((r) => json<GetRestaurantResponse>(r));
}

export function addQueue(code: string, body: AddQueueRequest): Promise<GetRestaurantResponse> {
  return fetch(`${API_URL}/restaurants/${code}/queues`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  }).then((r) => json<GetRestaurantResponse>(r));
}

export function updateQueue(id: string, body: UpdateQueueRequest): Promise<QueueResponse> {
  return fetch(`${API_URL}/queues/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  }).then((r) => json<QueueResponse>(r));
}
