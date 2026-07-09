import type { JsonObject, UUID } from './common';
import type { WaitlistEntry } from './entities';

// REST request/response contracts shared between the backend and the frontends.

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
