'use client';

import type {
  EntryAddedPayload,
  EntryRemovedPayload,
  EntryUpdatedPayload,
  Queue,
  WaitlistEntry,
} from '@nexa/types';
import { WS_EVENTS } from '@nexa/types';
import { BottomSheet, Button, Input, Stepper, WaitCard, cn } from '@nexa/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type Socket, io } from 'socket.io-client';

import {
  API_URL,
  getRestaurant,
  joinWaitlist,
  listQueueEntries,
  noShowEntry,
  notifyEntry,
  seatEntry,
} from '../lib/api';
import { getToken, signOut } from '../lib/auth';

const RESTAURANT_CODE = 'DEMO';

export default function BoardPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState('');
  const [queues, setQueues] = useState<Queue[]>([]);
  const [activeQueueId, setActiveQueueId] = useState('');
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  useEffect(() => {
    let socket: Socket | undefined;
    let cancelled = false;

    async function start() {
      if (!getToken()) return;
      const data = await getRestaurant(RESTAURANT_CODE);
      if (cancelled) return;
      setRestaurantName(data.restaurant.name);
      setQueues(data.queues);
      setActiveQueueId(data.queues[0]?.id ?? '');

      const snapshots = await Promise.all(
        data.queues.map((q) => listQueueEntries(data.restaurant.id, q.id)),
      );
      if (cancelled) return;
      setEntries(snapshots.flatMap((s) => s.entries));

      socket = io(API_URL, { transports: ['websocket'], auth: { token: getToken() ?? '' } });
      socket.on('connect', () => {
        setConnected(true);
        data.queues.forEach((q) =>
          socket?.emit('subscribe', { restaurantId: data.restaurant.id, queueId: q.id }),
        );
      });
      socket.on('disconnect', () => setConnected(false));
      socket.on(WS_EVENTS.ENTRY_ADDED, (p: EntryAddedPayload) => {
        setEntries((prev) => (prev.some((e) => e.id === p.entry.id) ? prev : [...prev, p.entry]));
      });
      socket.on(WS_EVENTS.ENTRY_UPDATED, (p: EntryUpdatedPayload) => {
        setEntries((prev) => prev.map((e) => (e.id === p.entry.id ? p.entry : e)));
      });
      socket.on(WS_EVENTS.ENTRY_REMOVED, (p: EntryRemovedPayload) => {
        setEntries((prev) => prev.filter((e) => e.id !== p.entryId));
      });
    }

    void start().catch(() => setConnected(false));
    return () => {
      cancelled = true;
      socket?.close();
    };
  }, []);

  const runAction = (fn: (id: string) => Promise<unknown>, id: string) => {
    fn(id).catch(() => undefined);
  };

  function logout() {
    signOut();
    router.replace('/login');
  }

  const countFor = (queueId: string) => entries.filter((e) => e.queueId === queueId).length;
  const visible = entries
    .filter((e) => e.queueId === activeQueueId)
    .sort((a, b) => a.position - b.position);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Cola en vivo</h1>
          <p className="font-body text-sm text-muted">{restaurantName || 'Cargando…'}</p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1 font-body text-xs font-semibold',
              connected ? 'bg-secondary/15 text-secondary-dark' : 'bg-black/5 text-muted',
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-secondary' : 'bg-muted')} />
            {connected ? 'En vivo' : 'Conectando…'}
          </span>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            + Agregar
          </Button>
          <button type="button" onClick={logout} className="font-body text-sm text-muted">
            Salir
          </button>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {queues.map((queue) => (
          <button
            key={queue.id}
            type="button"
            onClick={() => setActiveQueueId(queue.id)}
            className={cn(
              'rounded-full border px-4 py-2 font-body text-sm font-semibold transition-colors',
              queue.id === activeQueueId
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-foreground',
            )}
          >
            {queue.name} · {countFor(queue.id)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="font-body text-muted">No hay nadie en esta cola.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((entry) => (
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

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)}>
        <ManualAddForm
          queues={queues}
          defaultQueueId={activeQueueId}
          onClose={() => setShowAdd(false)}
        />
      </BottomSheet>
    </main>
  );
}

function ManualAddForm({
  queues,
  defaultQueueId,
  onClose,
}: {
  queues: Queue[];
  defaultQueueId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [queueId, setQueueId] = useState(defaultQueueId);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError('Escribe un nombre.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await joinWaitlist(RESTAURANT_CODE, {
        queueId,
        displayName: name.trim(),
        partySize,
        phone: phone.trim() || null,
      });
      onClose();
    } catch {
      setError('No se pudo agregar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-bold text-foreground">Agregar a la fila</h2>
      <label className="flex flex-col gap-1">
        <span className="font-body text-sm text-muted">Nombre</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-muted">Personas</span>
        <Stepper value={partySize} onChange={setPartySize} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-body text-sm text-muted">Cola</span>
        <div className="flex flex-wrap gap-2">
          {queues.map((queue) => (
            <button
              key={queue.id}
              type="button"
              onClick={() => setQueueId(queue.id)}
              className={cn(
                'rounded-full border px-4 py-2 font-body text-sm font-semibold transition-colors',
                queue.id === queueId
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-surface text-foreground',
              )}
            >
              {queue.name}
            </button>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1">
        <span className="font-body text-sm text-muted">Teléfono (opcional)</span>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      {error && <p className="font-body text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => void submit()} disabled={busy}>
          {busy ? 'Agregando…' : 'Agregar'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
