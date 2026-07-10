import type { JsonObject, UUID } from './common';
import type { Queue, Restaurant, ServiceReview, WaitlistEntry } from './entities';

// REST request/response contracts shared between the backend and the frontends.

/** GET /restaurants/:code — a restaurant with its active queues. */
export interface GetRestaurantResponse {
  restaurant: Restaurant;
  queues: Queue[];
}

/** A restaurant catalog entry with its current wait. */
export interface RestaurantSummary {
  id: UUID;
  name: string;
  code: string;
  /** People currently in line (waiting or notified). */
  waitingCount: number;
}

/** GET /restaurants — public catalog. */
export interface ListRestaurantsResponse {
  restaurants: RestaurantSummary[];
}

/** PATCH /restaurants/:code — update editable restaurant config. */
export interface UpdateRestaurantConfigRequest {
  name?: string;
  etaBaseMinutes?: number;
  expirationMinutes?: number;
}

/** POST /restaurants/:code/queues — add a queue. */
export interface AddQueueRequest {
  name: string;
  priority?: number;
}

/** PATCH /queues/:id — update a queue. */
export interface UpdateQueueRequest {
  name?: string;
  priority?: number;
  isActive?: boolean;
}

export interface QueueResponse {
  queue: Queue;
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

/** GET /entries/:id — a single waitlist entry (the diner's live status). */
export interface GetEntryResponse {
  entry: WaitlistEntry;
}

/** POST /entries/:id/review — post-service rating. */
export interface SubmitReviewRequest {
  rating: number;
  feedback?: string | null;
}

export interface SubmitReviewResponse {
  review: ServiceReview;
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
