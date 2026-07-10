import type { GetRestaurantResponse, JoinWaitlistRequest, JoinWaitlistResponse } from '@nexa/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to join (${res.status})`);
  return res.json() as Promise<JoinWaitlistResponse>;
}
