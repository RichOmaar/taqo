import type {
  EntryAddedPayload,
  EntryRemovedPayload,
  EntryUpdatedPayload,
  SubscribeEntryPayload,
  SubscribeQueuePayload,
} from '@nexa/types';
import { WS_CLIENT_EVENTS, WS_EVENTS, entryRoom, queueRoom } from '@nexa/types';
import type { Server as IOServer, Socket } from 'socket.io';

import { auth } from '../auth';
import type { WaitlistEventPublisher } from '../contexts/waitlist/application/ports';

const STAFF_ROLES = new Set<string>(['admin', 'hostess']);

/** Staff identity carried by a socket handshake. */
export interface SocketStaff {
  role: string;
  restaurantId: string | null;
}

/**
 * Whether a socket may join a restaurant's queue room.
 *
 * Pure so the authorization rule is testable without a socket or a session:
 * being staff is not enough, it must be staff *of that restaurant*.
 */
export function canSubscribeToQueue(staff: SocketStaff | null, restaurantId: string): boolean {
  if (!staff) return false;
  if (!STAFF_ROLES.has(staff.role)) return false;
  if (!staff.restaurantId) return false;
  return staff.restaurantId === restaurantId;
}

async function resolveStaff(socket: Socket): Promise<SocketStaff | null> {
  try {
    const token = (socket.handshake.auth as { token?: string } | undefined)?.token;
    if (!token) return null;
    const session = await auth.api.getSession({
      headers: new Headers({ authorization: `Bearer ${token}` }),
    });
    const user = session?.user as
      { role?: string | null; restaurantId?: string | null } | undefined;
    if (!user) return null;
    return { role: user.role ?? 'diner', restaurantId: user.restaurantId ?? null };
  } catch {
    return null;
  }
}

/**
 * Connections are open; access is scoped per subscription:
 * - staff subscribe to queue rooms (the live board),
 * - a diner subscribes to their own entry room (the entry id is the capability).
 */
export function setupWaitlistGateway(io: IOServer): void {
  io.on('connection', (socket: Socket) => {
    socket.on(WS_CLIENT_EVENTS.SUBSCRIBE_QUEUE, (payload: SubscribeQueuePayload) => {
      void (async () => {
        if (!payload?.restaurantId || !payload?.queueId) return;
        const staff = await resolveStaff(socket);
        if (canSubscribeToQueue(staff, payload.restaurantId)) {
          await socket.join(queueRoom(payload.restaurantId, payload.queueId));
        }
      })();
    });

    socket.on(WS_CLIENT_EVENTS.SUBSCRIBE_ENTRY, (payload: SubscribeEntryPayload) => {
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
