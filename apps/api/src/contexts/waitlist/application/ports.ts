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
