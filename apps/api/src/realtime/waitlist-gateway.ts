import type { EntryAddedPayload, EntryRemovedPayload, EntryUpdatedPayload } from '@nexa/types';
import { WS_EVENTS, queueRoom } from '@nexa/types';
import type { Server as IOServer, Socket } from 'socket.io';

import { auth } from '../auth';
import type { WaitlistEventPublisher } from '../contexts/waitlist/application/ports';

interface SubscribePayload {
  restaurantId: string;
  queueId: string;
}

const STAFF_ROLES = new Set(['admin', 'hostess']);

/** Wire socket subscriptions: an authenticated staff socket joins its queue rooms. */
export function setupWaitlistGateway(io: IOServer): void {
  // Only staff may subscribe to live queue updates; the token comes from the handshake.
  io.use(async (socket, next) => {
    try {
      const token = (socket.handshake.auth as { token?: string } | undefined)?.token;
      if (!token) return next(new Error('unauthorized'));
      const session = await auth.api.getSession({
        headers: new Headers({ authorization: `Bearer ${token}` }),
      });
      const role = (session?.user as { role?: string | null } | undefined)?.role ?? 'diner';
      if (!session?.user || !STAFF_ROLES.has(role)) return next(new Error('forbidden'));
      next();
    } catch (error) {
      console.error('[ws-auth] session check failed', error);
      next(new Error('unauthorized'));
    }
  });

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
