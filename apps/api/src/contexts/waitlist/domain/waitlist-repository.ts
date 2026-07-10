import type { JsonObject, WaitlistEntry, WaitlistStatus } from '@nexa/types';

/** Data required to create a new waitlist entry. */
export interface NewWaitlistEntry {
  queueId: string;
  restaurantId: string;
  userId: string | null;
  displayName: string;
  partySize: number;
  phone: string | null;
  position: number;
  etaMinutes: number | null;
  formData: JsonObject;
}

/** Optional timestamps to stamp during a status transition. */
export interface TransitionOptions {
  notified?: boolean;
  seated?: boolean;
}

export interface WaitlistRepository {
  /** Count entries still in the queue (waiting or notified). */
  countActiveInQueue(queueId: string): Promise<number>;
  create(entry: NewWaitlistEntry): Promise<WaitlistEntry>;
  /** Active entries in a queue, ordered by position. */
  listByQueue(queueId: string): Promise<WaitlistEntry[]>;
  findById(id: string): Promise<WaitlistEntry | null>;
  transition(
    id: string,
    status: WaitlistStatus,
    options?: TransitionOptions,
  ): Promise<WaitlistEntry>;
  /** Notified entries paired with their restaurant's expiration window. */
  findNotified(): Promise<Array<{ entry: WaitlistEntry; expirationMinutes: number }>>;
}
