import type { Queue, Restaurant, WaitlistEntry } from '@nexa/types';

export function makeRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id: 'r1',
    name: 'Bistro Moderno',
    code: 'DEMO',
    qrToken: 'token',
    etaBaseMinutes: 10,
    expirationMinutes: 10,
    plan: 'free',
    timezone: 'America/Mexico_City',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeQueue(overrides: Partial<Queue> = {}): Queue {
  return {
    id: 'q1',
    restaurantId: 'r1',
    name: 'General',
    description: null,
    priority: 0,
    isActive: true,
    ...overrides,
  };
}

export function makeEntry(overrides: Partial<WaitlistEntry> = {}): WaitlistEntry {
  return {
    id: 'e1',
    queueId: 'q1',
    restaurantId: 'r1',
    userId: null,
    displayName: 'Ana',
    partySize: 2,
    phone: null,
    status: 'waiting',
    position: 1,
    etaMinutes: 10,
    etaIsManual: false,
    formData: {},
    joinedAt: '2026-01-01T00:00:00.000Z',
    notifiedAt: null,
    seatedAt: null,
    ...overrides,
  };
}
