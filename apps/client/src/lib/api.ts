import type {
  EntryActionResponse,
  GetEntryResponse,
  GetRestaurantResponse,
  JoinWaitlistRequest,
  JoinWaitlistResponse,
  ListRestaurantsResponse,
  SubmitReviewRequest,
  SubmitReviewResponse,
} from '@nexa/types';

import { authHeader } from './auth';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function leaveWaitlist(entryId: string): Promise<EntryActionResponse> {
  const res = await fetch(`${API_URL}/entries/${entryId}/leave`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to leave (${res.status})`);
  return res.json() as Promise<EntryActionResponse>;
}

export async function submitReview(
  entryId: string,
  body: SubmitReviewRequest,
): Promise<SubmitReviewResponse> {
  const res = await fetch(`${API_URL}/entries/${entryId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to submit review (${res.status})`);
  return res.json() as Promise<SubmitReviewResponse>;
}

export async function listRestaurants(): Promise<ListRestaurantsResponse> {
  const res = await fetch(`${API_URL}/restaurants`);
  if (!res.ok) throw new Error(`Failed to load catalog (${res.status})`);
  return res.json() as Promise<ListRestaurantsResponse>;
}

export async function getEntry(id: string): Promise<GetEntryResponse> {
  const res = await fetch(`${API_URL}/entries/${id}`);
  if (!res.ok) throw new Error(`Failed to load entry (${res.status})`);
  return res.json() as Promise<GetEntryResponse>;
}

export async function getRestaurant(code: string): Promise<GetRestaurantResponse> {
  const res = await fetch(`${API_URL}/restaurants/${code}`);
  if (!res.ok) throw new Error(`Failed to load restaurant (${res.status})`);
  return res.json() as Promise<GetRestaurantResponse>;
}

export async function joinWaitlist(
  code: string,
  body: JoinWaitlistRequest,
): Promise<JoinWaitlistResponse> {
  const res = await fetch(`${API_URL}/restaurants/${code}/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to join (${res.status})`);
  return res.json() as Promise<JoinWaitlistResponse>;
}
