import type { ISODateString, JsonObject, UUID } from './common';
import type { Queue, Restaurant, ServiceReview, StaffUser, WaitlistEntry } from './entities';

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

/**
 * GET /me (staff) — the signed-in staff user and the restaurant they manage.
 * Lets a frontend resolve its restaurant from the session instead of
 * hardcoding a code.
 */
export interface GetCurrentStaffResponse {
  user: StaffUser;
  restaurant: Restaurant;
}

/**
 * Owner dashboard KPIs.
 *
 * Each ratio ships with the count it was computed from. Without them a rate of
 * 0 is ambiguous — no no-shows out of two hundred covers reads identically to
 * no data at all — and the dashboard cannot tell a real figure from an empty
 * one.
 */
export interface RestaurantMetrics {
  /** Average wait (join → seated), in minutes; null with no data. */
  averageWaitMinutes: number | null;
  /** Seated entries the average wait was computed from. */
  seatedCount: number;
  /** Diners who joined within the requested range. */
  peopleJoined: number;
  /** no_show / resolved entries (0–1). */
  noShowRate: number;
  /** seated / resolved entries (0–1). */
  seatedConversion: number;
  /** Resolved entries (seated + no-show + cancelled) behind both ratios. */
  resolvedCount: number;
  /** Average service rating (1–5); null with no reviews. */
  averageRating: number | null;
  /** Reviews the average rating was computed from. */
  reviewCount: number;
}

/** The window a metric was computed over. `to` is exclusive. */
export interface MetricsRange {
  from: ISODateString;
  to: ISODateString;
}

/** GET /restaurants/:code/metrics?from=&to= (staff). */
export interface GetMetricsResponse {
  metrics: RestaurantMetrics;
  /** Echoes the resolved window, since the default is server-side. */
  range: MetricsRange;
  /**
   * The same metrics over the equally long window immediately before, for
   * period-over-period comparison. The UI computes the deltas: it knows which
   * direction is good news for each metric, which the API does not.
   */
  previous: RestaurantMetrics;
  previousRange: MetricsRange;
}

/** Bucket size for a metrics time series. */
export const METRICS_BUCKETS = ['hour', 'day'] as const;
export type MetricsBucket = (typeof METRICS_BUCKETS)[number];

/** One bucket of the volume series. */
export interface MetricsSeriesPoint {
  /** Start of the bucket, as an instant. */
  at: ISODateString;
  /** Diners who joined during the bucket. */
  joined: number;
  /** Of those, how many were seated. */
  seated: number;
}

/** GET /restaurants/:code/metrics/timeseries?from=&to=&bucket= (staff). */
export interface GetMetricsSeriesResponse {
  /** Every bucket in the range, including empty ones, oldest first. */
  points: MetricsSeriesPoint[];
  bucket: MetricsBucket;
  range: MetricsRange;
  /** Zone the buckets are aligned to, so the UI labels them consistently. */
  timezone: string;
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

/** GET /push/public-key — VAPID public key for the browser (null if push is off). */
export interface VapidKeyResponse {
  publicKey: string | null;
}

/** POST /entries/:id/push-subscription — browser push subscription. */
export interface PushSubscriptionRequest {
  endpoint: string;
  keys: { p256dh: string; auth: string };
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
