import type {
  EntryAddedPayload,
  EntryRemovedPayload,
  EntryUpdatedPayload,
  WaitlistEntry,
} from '@nexa/types';

/** Outbound port for publishing waitlist domain events (implemented by the WS layer). */
export interface WaitlistEventPublisher {
  entryAdded(payload: EntryAddedPayload): void;
  entryUpdated(payload: EntryUpdatedPayload): void;
  entryRemoved(payload: EntryRemovedPayload): void;
}

/** Outbound port for notifying a diner (implemented by the notifications context). */
export interface DinerNotifier {
  tableReady(entry: WaitlistEntry): void;
}

/**
 * Outbound port for crediting a loyalty visit (implemented by the memberships
 * context).
 *
 * Declared here so waitlist never imports memberships: seating a diner is the
 * core loop and must not depend on a programme existing, or on it succeeding.
 * The default binding is a no-op.
 */
export interface VisitRecorder {
  dinerSeated(entry: WaitlistEntry): void;
}
