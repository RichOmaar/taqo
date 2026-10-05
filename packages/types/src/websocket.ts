import type { UUID } from './common';
import type { WaitlistEntry } from './entities';

// Server -> client WebSocket events for live waitlist updates.
export const WS_EVENTS = {
  ENTRY_ADDED: 'entry_added',
  ENTRY_UPDATED: 'entry_updated',
  ENTRY_REMOVED: 'entry_removed',
} as const;
export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

export interface EntryAddedPayload {
  entry: WaitlistEntry;
}

export interface EntryUpdatedPayload {
  entry: WaitlistEntry;
}

export interface EntryRemovedPayload {
  entryId: UUID;
  queueId: UUID;
  restaurantId: UUID;
}

// Client -> server subscription events. Both the gateway and the clients must
// use these names; they are the other half of the realtime contract.
export const WS_CLIENT_EVENTS = {
  SUBSCRIBE_QUEUE: 'subscribe',
  SUBSCRIBE_ENTRY: 'subscribe-entry',
} as const;
export type WsClientEventName = (typeof WS_CLIENT_EVENTS)[keyof typeof WS_CLIENT_EVENTS];

/** Payload for `subscribe` — staff joining a queue room. */
export interface SubscribeQueuePayload {
  restaurantId: UUID;
  queueId: UUID;
}

/** Payload for `subscribe-entry` — a diner joining their own entry room. */
export interface SubscribeEntryPayload {
  entryId: UUID;
}

/** Discriminated union of all server-emitted waitlist events. */
export type WaitlistServerEvent =
  | { event: typeof WS_EVENTS.ENTRY_ADDED; data: EntryAddedPayload }
  | { event: typeof WS_EVENTS.ENTRY_UPDATED; data: EntryUpdatedPayload }
  | { event: typeof WS_EVENTS.ENTRY_REMOVED; data: EntryRemovedPayload };

/**
 * Room key for a restaurant queue channel. Reception subscribes to its
 * restaurant's queues; both server and clients must build the key identically.
 */
export function queueRoom(restaurantId: UUID, queueId: UUID): string {
  return `restaurant:${restaurantId}:queue:${queueId}`;
}

/** Room key for a single diner's own entry channel. */
export function entryRoom(entryId: UUID): string {
  return `entry:${entryId}`;
}
