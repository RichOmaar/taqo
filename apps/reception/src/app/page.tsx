'use client';

import type {
  EntryAddedPayload,
  EntryRemovedPayload,
  EntryUpdatedPayload,
  Queue,
  WaitlistEntry,
} from '@nexa/types';
import { WS_EVENTS } from '@nexa/types';
import { Button, WaitCard, cn } from '@nexa/ui';
import { useEffect, useState } from 'react';
import { type Socket, io } from 'socket.io-client';

import {
  API_URL,
  getRestaurant,
  listQueueEntries,
  noShowEntry,
  notifyEntry,
  seatEntry,
} from '../lib/api';

const RESTAURANT_CODE = 'DEMO';

export default function BoardPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const [queue, setQueue] = useState<Queue | null>(null);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: Socket | undefined;
    let cancelled = false;

    async function start() {
      const data = await getRestaurant(RESTAURANT_CODE);
      const general = data.queues.find((q) => q.name === 'General') ?? data.queues[0];
      if (!general || cancelled) return;

      setRestaurantName(data.restaurant.name);
      setQueue(general);

      const snapshot = await listQueueEntries(data.restaurant.id, general.id);
      if (cancelled) return;
      setEntries(snapshot.entries);

      socket = io(API_URL, { transports: ['websocket'] });
      socket.on('connect', () => {
        setConnected(true);
        socket?.emit('subscribe', { restaurantId: data.restaurant.id, queueId: general.id });
      });
      socket.on('disconnect', () => setConnected(false));
      socket.on(WS_EVENTS.ENTRY_ADDED, (payload: EntryAddedPayload) => {
        setEntries((prev) =>
          prev.some((e) => e.id === payload.entry.id)
            ? prev
            : [...prev, payload.entry].sort((a, b) => a.position - b.position),
        );
      });
      socket.on(WS_EVENTS.ENTRY_UPDATED, (payload: EntryUpdatedPayload) => {
        setEntries((prev) => prev.map((e) => (e.id === payload.entry.id ? payload.entry : e)));
      });
      socket.on(WS_EVENTS.ENTRY_REMOVED, (payload: EntryRemovedPayload) => {
        setEntries((prev) => prev.filter((e) => e.id !== payload.entryId));
      });
    }

    void start().catch(() => setConnected(false));

    return () => {
      cancelled = true;
      socket?.close();
    };
  }, []);

  // The board reflects the WebSocket events; action failures are ignored here.
  const runAction = (fn: (id: string) => Promise<unknown>, id: string) => {
    fn(id).catch(() => undefined);
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Cola en vivo</h1>
          <p className="font-body text-sm text-muted">
            {restaurantName || 'Cargando…'}
            {queue ? ` · ${queue.name}` : ''}
          </p>
        </div>
        <span
          className={cn(
            'flex items-center gap-2 rounded-full px-3 py-1 font-body text-xs font-semibold',
            connected ? 'bg-secondary/15 text-secondary-dark' : 'bg-black/5 text-muted',
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-secondary' : 'bg-muted')} />
          {connected ? 'En vivo' : 'Conectando…'}
        </span>
      </header>

      {entries.length === 0 ? (
        <p className="font-body text-muted">No hay nadie en la fila todavía.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <WaitCard
              key={entry.id}
              name={entry.displayName}
              partySize={entry.partySize}
              status={entry.status}
              waitingLabel={`Lugar #${entry.position}`}
              etaLabel={entry.etaMinutes != null ? `~${entry.etaMinutes} min` : undefined}
            >
              {entry.status === 'waiting' && (
                <Button size="sm" onClick={() => runAction(notifyEntry, entry.id)}>
                  Avisar
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => runAction(seatEntry, entry.id)}>
                Sentar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => runAction(noShowEntry, entry.id)}>
                No-show
              </Button>
            </WaitCard>
          ))}
        </div>
      )}
    </main>
  );
}
