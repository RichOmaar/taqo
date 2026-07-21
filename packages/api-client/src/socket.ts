import type {
  EntryAddedPayload,
  EntryRemovedPayload,
  EntryUpdatedPayload,
  UUID,
} from '@nexa/types';
import { WS_CLIENT_EVENTS, WS_EVENTS } from '@nexa/types';
import { io } from 'socket.io-client';

/** Minimal surface this wrapper needs, so tests can supply a fake. */
export interface SocketLike {
  readonly connected: boolean;
  on(event: string, handler: (payload: never) => void): void;
  off(event: string, handler?: (payload: never) => void): void;
  emit(event: string, payload?: unknown): void;
  disconnect(): void;
}

export type SocketFactory = (
  url: string,
  options: { auth: { token: string | null } },
) => SocketLike;

export interface WaitlistSocketOptions {
  /** API origin the socket connects to. */
  baseUrl: string;
  /** Bearer token sent in the handshake; staff subscriptions require it. */
  getToken?: () => string | null;
  /** Injectable for tests. Defaults to socket.io-client. */
  factory?: SocketFactory;
}

export interface WaitlistSocketListeners {
  onEntryAdded?: (payload: EntryAddedPayload) => void;
  onEntryUpdated?: (payload: EntryUpdatedPayload) => void;
  onEntryRemoved?: (payload: EntryRemovedPayload) => void;
  /** Fires on connect and disconnect, for a live/offline indicator. */
  onConnectionChange?: (connected: boolean) => void;
}

export interface WaitlistSocket {
  /** Subscribes to a queue room. Requires a staff token. */
  subscribeToQueue(restaurantId: UUID, queueId: UUID): void;
  /** Subscribes to a single entry room. The entry id is the capability. */
  subscribeToEntry(entryId: UUID): void;
  /** Registers listeners; returns a function that removes them. */
  listen(listeners: WaitlistSocketListeners): () => void;
  disconnect(): void;
  readonly connected: boolean;
}

type Subscription =
  { kind: 'queue'; restaurantId: UUID; queueId: UUID } | { kind: 'entry'; entryId: UUID };

const defaultFactory: SocketFactory = (url, options) =>
  io(url, { auth: options.auth, transports: ['websocket', 'polling'] }) as unknown as SocketLike;

/**
 * Typed wrapper over the waitlist realtime channel.
 *
 * Socket.IO reconnects on its own, but room membership does not survive a
 * reconnect — the server only joins rooms in response to a subscribe event.
 * This tracks what was subscribed and replays it on every `connect`, so a
 * dropped connection doesn't silently leave the UI stale.
 */
export function createWaitlistSocket(options: WaitlistSocketOptions): WaitlistSocket {
  const factory = options.factory ?? defaultFactory;
  const socket = factory(options.baseUrl, { auth: { token: options.getToken?.() ?? null } });
  const subscriptions: Subscription[] = [];

  function send(subscription: Subscription): void {
    if (subscription.kind === 'queue') {
      socket.emit(WS_CLIENT_EVENTS.SUBSCRIBE_QUEUE, {
        restaurantId: subscription.restaurantId,
        queueId: subscription.queueId,
      });
    } else {
      socket.emit(WS_CLIENT_EVENTS.SUBSCRIBE_ENTRY, { entryId: subscription.entryId });
    }
  }

  socket.on('connect', () => {
    for (const subscription of subscriptions) send(subscription);
  });

  function remember(subscription: Subscription): void {
    subscriptions.push(subscription);
    // Already connected: the `connect` replay has been and gone, so send now.
    if (socket.connected) send(subscription);
  }

  return {
    get connected() {
      return socket.connected;
    },

    subscribeToQueue(restaurantId, queueId) {
      remember({ kind: 'queue', restaurantId, queueId });
    },

    subscribeToEntry(entryId) {
      remember({ kind: 'entry', entryId });
    },

    listen(listeners) {
      const bound: [string, (payload: never) => void][] = [];

      if (listeners.onEntryAdded) {
        bound.push([WS_EVENTS.ENTRY_ADDED, listeners.onEntryAdded as (p: never) => void]);
      }
      if (listeners.onEntryUpdated) {
        bound.push([WS_EVENTS.ENTRY_UPDATED, listeners.onEntryUpdated as (p: never) => void]);
      }
      if (listeners.onEntryRemoved) {
        bound.push([WS_EVENTS.ENTRY_REMOVED, listeners.onEntryRemoved as (p: never) => void]);
      }
      if (listeners.onConnectionChange) {
        const notify = listeners.onConnectionChange;
        bound.push(
          ['connect', (() => notify(true)) as (p: never) => void],
          ['disconnect', (() => notify(false)) as (p: never) => void],
        );
      }

      for (const [event, handler] of bound) socket.on(event, handler);

      return () => {
        for (const [event, handler] of bound) socket.off(event, handler);
      };
    },

    disconnect() {
      subscriptions.length = 0;
      socket.disconnect();
    },
  };
}
