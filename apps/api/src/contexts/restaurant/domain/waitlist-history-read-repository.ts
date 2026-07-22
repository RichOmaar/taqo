import type { WaitlistHistoryEntry, WaitlistStatus } from '@nexa/types';

import type { TimeRange } from '../../../shared/time-range';

/**
 * Position in the history list.
 *
 * Compound rather than a bare timestamp: a busy restaurant can take two
 * diners in the same millisecond, and a cursor on `joinedAt` alone would skip
 * one of them at a page boundary.
 */
export interface WaitlistHistoryCursor {
  joinedAt: Date;
  id: string;
}

export interface ListWaitlistHistoryQuery {
  range?: TimeRange;
  status?: WaitlistStatus;
  queueId?: string;
  /** Case-insensitive substring of the diner's name. */
  search?: string;
  limit: number;
  cursor?: WaitlistHistoryCursor;
}

export interface WaitlistHistoryReadRepository {
  /** Newest first. Returns at most `limit` entries. */
  list(restaurantId: string, query: ListWaitlistHistoryQuery): Promise<WaitlistHistoryEntry[]>;
}
