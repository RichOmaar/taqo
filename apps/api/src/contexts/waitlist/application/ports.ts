import type { EntryAddedPayload, EntryRemovedPayload, EntryUpdatedPayload } from '@nexa/types';

/** Outbound port for publishing waitlist domain events (implemented by the WS layer). */
export interface WaitlistEventPublisher {
  entryAdded(payload: EntryAddedPayload): void;
  entryUpdated(payload: EntryUpdatedPayload): void;
  entryRemoved(payload: EntryRemovedPayload): void;
}
