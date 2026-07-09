import type { JsonObject, WaitlistEntry } from '@nexa/types';

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

export interface WaitlistRepository {
  /** Count entries still in the queue (waiting or notified). */
  countActiveInQueue(queueId: string): Promise<number>;
  create(entry: NewWaitlistEntry): Promise<WaitlistEntry>;
  /** Active entries in a queue, ordered by position. */
  listByQueue(queueId: string): Promise<WaitlistEntry[]>;
}
