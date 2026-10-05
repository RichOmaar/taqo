import type { EntryAddedPayload } from '@nexa/types';

/** Outbound port for publishing waitlist domain events (implemented by the WS layer). */
export interface WaitlistEventPublisher {
  entryAdded(payload: EntryAddedPayload): void;
}
