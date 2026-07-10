import type { EntryAddedPayload, EntryRemovedPayload, EntryUpdatedPayload } from '@nexa/types';
import { WS_EVENTS, entryRoom, queueRoom } from '@nexa/types';
import type { Server as IOServer, Socket } from 'socket.io';

import { auth } from '../auth';
import type { WaitlistEventPublisher } from '../contexts/waitlist/application/ports';

interface QueueSubscribePayload {
  restaurantId: string;
  queueId: string;
}

interface EntrySubscribePayload {
  entryId: string;
}

const STAFF_ROLES = new Set(['admin', 'hostess']);

async function isStaff(socket: Socket): Promise<boolean> {
  try {
    const token = (socket.handshake.auth as { token?: string } | undefined)?.token;
    if (!token) return false;
    const session = await auth.api.getSession({
      headers: new Headers({ authorization: `Bearer ${token}` }),
    });
    const role = (session?.user as { role?: string | null } | undefined)?.role ?? 'diner';
    return Boolean(session?.user) && STAFF_ROLES.has(role);
  } catch {
    return false;
  }
}

/**
 * Connections are open; access is scoped per subscription:
 * - staff subscribe to queue rooms (the live board),
 * - a diner subscribes to their own entry room (the entry id is the capability).
 */
export function setupWaitlistGateway(io: IOServer): void {
  io.on('connection', (socket: Socket) => {
    socket.on('subscribe', (payload: QueueSubscribePayload) => {
      void (async () => {
        if (!payload?.restaurantId || !payload?.queueId) return;
        if (await isStaff(socket)) {
          await socket.join(queueRoom(payload.restaurantId, payload.queueId));
        }
      })();
    });

    socket.on('subscribe-entry', (payload: EntrySubscribePayload) => {
      if (payload?.entryId) void socket.join(entryRoom(payload.entryId));
    });
  });
}

/** Publisher that emits to the queue room (staff) and the entry room (diner). */
export function createWaitlistPublisher(io: IOServer): WaitlistEventPublisher {
  return {
    entryAdded(payload: EntryAddedPayload) {
      const { restaurantId, queueId } = payload.entry;
      io.to(queueRoom(restaurantId, queueId)).emit(WS_EVENTS.ENTRY_ADDED, payload);
    },
    entryUpdated(payload: EntryUpdatedPayload) {
      const { restaurantId, queueId, id } = payload.entry;
      io.to(queueRoom(restaurantId, queueId))
        .to(entryRoom(id))
        .emit(WS_EVENTS.ENTRY_UPDATED, payload);
    },
    entryRemoved(payload: EntryRemovedPayload) {
      io.to(queueRoom(payload.restaurantId, payload.queueId))
        .to(entryRoom(payload.entryId))
        .emit(WS_EVENTS.ENTRY_REMOVED, payload);
    },
  };
}
