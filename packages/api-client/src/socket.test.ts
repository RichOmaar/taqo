import { WS_CLIENT_EVENTS, WS_EVENTS } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { createWaitlistSocket, type SocketLike } from './socket';

/** In-memory stand-in for a socket.io client. */
function fakeSocket() {
  const handlers = new Map<string, Set<(payload: never) => void>>();
  const emitted: { event: string; payload?: unknown }[] = [];

  const socket = {
    connected: false,
    on(event: string, handler: (payload: never) => void) {
      const set = handlers.get(event) ?? new Set();
      set.add(handler);
      handlers.set(event, set);
    },
    off(event: string, handler?: (payload: never) => void) {
      if (!handler) handlers.delete(event);
      else handlers.get(event)?.delete(handler);
    },
    emit(event: string, payload?: unknown) {
      emitted.push({ event, payload });
    },
    disconnect: vi.fn(),
  };

  return {
    socket: socket as unknown as SocketLike,
    emitted,
    /** Simulates a server-pushed event. */
    fire(event: string, payload: unknown) {
      for (const handler of handlers.get(event) ?? []) (handler as (p: unknown) => void)(payload);
    },
    setConnected(value: boolean) {
      socket.connected = value;
    },
    listenerCount(event: string) {
      return handlers.get(event)?.size ?? 0;
    },
  };
}

function build(getToken?: () => string | null) {
  const fake = fakeSocket();
  const factory = vi.fn(() => fake.socket);
  const client = createWaitlistSocket({ baseUrl: 'http://api.test', getToken, factory });
  return { fake, factory, client };
}

describe('createWaitlistSocket', () => {
  it('passes the bearer token in the handshake', () => {
    const { factory } = build(() => 'tok_123');

    expect(factory).toHaveBeenCalledWith('http://api.test', { auth: { token: 'tok_123' } });
  });

  it('passes a null token when signed out', () => {
    const { factory } = build();

    expect(factory).toHaveBeenCalledWith('http://api.test', { auth: { token: null } });
  });

  it('queues a subscription made before connect, then sends it on connect', () => {
    const { fake, client } = build();

    client.subscribeToQueue('r1', 'q1');
    expect(fake.emitted).toHaveLength(0);

    fake.setConnected(true);
    fake.fire('connect', undefined);

    expect(fake.emitted).toEqual([
      { event: WS_CLIENT_EVENTS.SUBSCRIBE_QUEUE, payload: { restaurantId: 'r1', queueId: 'q1' } },
    ]);
  });

  it('sends immediately when already connected', () => {
    const { fake, client } = build();
    fake.setConnected(true);

    client.subscribeToEntry('e1');

    expect(fake.emitted).toEqual([
      { event: WS_CLIENT_EVENTS.SUBSCRIBE_ENTRY, payload: { entryId: 'e1' } },
    ]);
  });

  it('replays every subscription on reconnect', () => {
    const { fake, client } = build();

    client.subscribeToQueue('r1', 'q1');
    client.subscribeToQueue('r1', 'q2');
    fake.setConnected(true);
    fake.fire('connect', undefined);
    fake.emitted.length = 0;

    // Connection dropped and came back: rooms are gone server-side.
    fake.fire('connect', undefined);

    expect(fake.emitted).toEqual([
      { event: WS_CLIENT_EVENTS.SUBSCRIBE_QUEUE, payload: { restaurantId: 'r1', queueId: 'q1' } },
      { event: WS_CLIENT_EVENTS.SUBSCRIBE_QUEUE, payload: { restaurantId: 'r1', queueId: 'q2' } },
    ]);
  });

  it('routes server events to the matching listener', () => {
    const { fake, client } = build();
    const onEntryAdded = vi.fn();
    const onEntryUpdated = vi.fn();
    const onEntryRemoved = vi.fn();

    client.listen({ onEntryAdded, onEntryUpdated, onEntryRemoved });

    fake.fire(WS_EVENTS.ENTRY_ADDED, { entry: { id: 'e1' } });
    fake.fire(WS_EVENTS.ENTRY_REMOVED, { entryId: 'e1', queueId: 'q1', restaurantId: 'r1' });

    expect(onEntryAdded).toHaveBeenCalledWith({ entry: { id: 'e1' } });
    expect(onEntryRemoved).toHaveBeenCalledWith({
      entryId: 'e1',
      queueId: 'q1',
      restaurantId: 'r1',
    });
    expect(onEntryUpdated).not.toHaveBeenCalled();
  });

  it('removes only its own listeners when the returned function is called', () => {
    const { fake, client } = build();

    const stop = client.listen({ onEntryAdded: vi.fn() });
    expect(fake.listenerCount(WS_EVENTS.ENTRY_ADDED)).toBe(1);

    stop();

    expect(fake.listenerCount(WS_EVENTS.ENTRY_ADDED)).toBe(0);
  });

  it('reports connection changes for a live indicator', () => {
    const { fake, client } = build();
    const onConnectionChange = vi.fn();

    client.listen({ onConnectionChange });
    fake.fire('connect', undefined);
    fake.fire('disconnect', 'transport close');

    expect(onConnectionChange).toHaveBeenNthCalledWith(1, true);
    expect(onConnectionChange).toHaveBeenNthCalledWith(2, false);
  });

  it('drops remembered subscriptions on disconnect so they are not replayed', () => {
    const { fake, client } = build();

    client.subscribeToQueue('r1', 'q1');
    client.disconnect();
    fake.emitted.length = 0;
    fake.fire('connect', undefined);

    expect(fake.emitted).toHaveLength(0);
  });
});
