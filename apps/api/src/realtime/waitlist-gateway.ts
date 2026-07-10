import type { EntryAddedPayload, EntryRemovedPayload, EntryUpdatedPayload } from '@nexa/types';
import { WS_EVENTS, queueRoom } from '@nexa/types';
import type { Server as IOServer, Socket } from 'socket.io';

import type { WaitlistEventPublisher } from '../contexts/waitlist/application/ports';

interface SubscribePayload {
  restaurantId: string;
  queueId: string;
}

/** Wire socket subscriptions: a client joins the room for a restaurant queue. */
export function setupWaitlistGateway(io: IOServer): void {
  io.on('connection', (socket: Socket) => {
    socket.on('subscribe', (payload: SubscribePayload) => {
      if (payload?.restaurantId && payload?.queueId) {
        void socket.join(queueRoom(payload.restaurantId, payload.queueId));
      }
    });
  });
}

/** Publisher that emits waitlist events to the relevant queue room. */
export function createWaitlistPublisher(io: IOServer): WaitlistEventPublisher {
  return {
    entryAdded(payload: EntryAddedPayload) {
      const { restaurantId, queueId } = payload.entry;
      io.to(queueRoom(restaurantId, queueId)).emit(WS_EVENTS.ENTRY_ADDED, payload);
    },
    entryUpdated(payload: EntryUpdatedPayload) {
      const { restaurantId, queueId } = payload.entry;
      io.to(queueRoom(restaurantId, queueId)).emit(WS_EVENTS.ENTRY_UPDATED, payload);
    },
    entryRemoved(payload: EntryRemovedPayload) {
      io.to(queueRoom(payload.restaurantId, payload.queueId)).emit(
        WS_EVENTS.ENTRY_REMOVED,
        payload,
      );
    },
  };
}
