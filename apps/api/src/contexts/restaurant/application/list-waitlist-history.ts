import { WAITLIST_STATUSES, type WaitlistHistoryEntry, type WaitlistStatus } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { TimeRange } from '../../../shared/time-range';
import type { RestaurantRepository } from '../domain/restaurant-repository';
import type {
  WaitlistHistoryCursor,
  WaitlistHistoryReadRepository,
} from '../domain/waitlist-history-read-repository';

export interface ListWaitlistHistoryInput {
  from?: Date;
  to?: Date;
  status?: string;
  queueId?: string;
  search?: string;
  limit?: number;
  /** Opaque to callers; encodes the position of the last item seen. */
  cursor?: string;
}

export interface ListWaitlistHistoryResult {
  entries: WaitlistHistoryEntry[];
  nextCursor: string | null;
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 100;

/** Encodes a cursor so callers cannot build one by hand and depend on its shape. */
export function encodeCursor(cursor: WaitlistHistoryCursor): string {
  return Buffer.from(`${cursor.joinedAt.toISOString()}|${cursor.id}`).toString('base64url');
}

export function decodeCursor(value: string): WaitlistHistoryCursor {
  const [at, id] = Buffer.from(value, 'base64url').toString('utf8').split('|');
  const joinedAt = at ? new Date(at) : new Date(Number.NaN);

  if (!id || Number.isNaN(joinedAt.getTime())) {
    throw new ValidationError('Invalid cursor');
  }

  return { joinedAt, id };
}

/** Query: a restaurant's past waitlist entries, newest first. */
export class ListWaitlistHistory {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly history: WaitlistHistoryReadRepository,
  ) {}

  async execute(
    code: string,
    input: ListWaitlistHistoryInput = {},
  ): Promise<ListWaitlistHistoryResult> {
    const found = await this.restaurants.findByCode(code);
    if (!found) throw new NotFoundError('Restaurant not found');

    const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));

    // Ask for one more than requested: if it comes back, there is another page,
    // which avoids a second count query just to answer "is there more".
    const rows = await this.history.list(found.restaurant.id, {
      range: this.resolveRange(input),
      status: this.resolveStatus(input.status),
      queueId: input.queueId,
      search: this.resolveSearch(input.search),
      limit: limit + 1,
      cursor: input.cursor ? decodeCursor(input.cursor) : undefined,
    });

    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    const hasMore = rows.length > limit;

    return {
      entries: page,
      nextCursor:
        hasMore && last ? encodeCursor({ joinedAt: new Date(last.joinedAt), id: last.id }) : null,
    };
  }

  private resolveStatus(status?: string): WaitlistStatus | undefined {
    if (status === undefined) return undefined;

    // Rejected rather than ignored: a typo'd filter that silently returns
    // everything reads as "there were no no-shows", which is a lie.
    if (!(WAITLIST_STATUSES as readonly string[]).includes(status)) {
      throw new ValidationError('Unknown status filter');
    }

    return status as WaitlistStatus;
  }

  /** Blank searches mean "no filter" rather than "match the empty string". */
  private resolveSearch(search?: string): string | undefined {
    const trimmed = search?.trim();
    if (!trimmed) return undefined;

    if (trimmed.length > MAX_SEARCH_LENGTH) {
      throw new ValidationError('Search term is too long');
    }

    return trimmed;
  }

  /** Undefined means "all time"; the caller decides when to narrow it. */
  private resolveRange(input: ListWaitlistHistoryInput): TimeRange | undefined {
    if (!input.from && !input.to) return undefined;

    const from = input.from ?? new Date(0);
    const to = input.to ?? new Date('9999-12-31T00:00:00Z');

    if (to.getTime() <= from.getTime()) {
      throw new ValidationError('Range end must be after its start');
    }

    return { from, to };
  }
}
