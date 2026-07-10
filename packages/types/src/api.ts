import type { JsonObject, UUID } from './common';
import type { Queue, Restaurant, WaitlistEntry } from './entities';

// REST request/response contracts shared between the backend and the frontends.

/** GET /restaurants/:code — a restaurant with its active queues. */
export interface GetRestaurantResponse {
  restaurant: Restaurant;
  queues: Queue[];
}

/** POST /restaurants/:code/waitlist — join a queue (guest-friendly). */
export interface JoinWaitlistRequest {
  queueId: UUID;
  displayName: string;
  partySize: number;
  phone?: string | null;
  /** Answers to the restaurant's configurable form (defined in Strapi). */
  formData?: JsonObject;
}

export interface JoinWaitlistResponse {
  entry: WaitlistEntry;
}

/** Response for entry lifecycle actions (notify/seat/no-show/cancel). */
export interface EntryActionResponse {
  entry: WaitlistEntry;
}

/** GET /restaurants/:restaurantId/queues/:queueId/entries — live queue snapshot. */
export interface ListQueueEntriesResponse {
  entries: WaitlistEntry[];
}

/** Standard error envelope returned by the API. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: JsonObject;
  };
}
