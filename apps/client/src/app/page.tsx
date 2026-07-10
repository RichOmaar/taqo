'use client';

import type { EntryRemovedPayload, EntryUpdatedPayload, Queue, WaitlistEntry } from '@nexa/types';
import { WS_EVENTS } from '@nexa/types';
import { Button, Card, Input, StatusBadge, Stepper, cn } from '@nexa/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { API_URL, getEntry, getRestaurant, joinWaitlist } from '../lib/api';

const RESTAURANT_CODE = 'DEMO';

export default function JoinPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const [queues, setQueues] = useState<Queue[]>([]);
  const [queueId, setQueueId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<WaitlistEntry | null>(null);

  useEffect(() => {
    getRestaurant(RESTAURANT_CODE)
      .then((data) => {
        setRestaurantName(data.restaurant.name);
        setQueues(data.queues);
        setQueueId(data.queues[0]?.id ?? '');
      })
      .catch(() => setError('No pudimos cargar el restaurante.'));
  }, []);

  // Live status: subscribe to this entry's room once we have joined.
  const entryId = entry?.id;
  useEffect(() => {
    if (!entryId) return;
    const socket = io(API_URL, { transports: ['websocket'] });
    socket.on('connect', () => socket.emit('subscribe-entry', { entryId }));
    socket.on(WS_EVENTS.ENTRY_UPDATED, (p: EntryUpdatedPayload) => {
      if (p.entry.id === entryId) setEntry(p.entry);
    });
    socket.on(WS_EVENTS.ENTRY_REMOVED, (p: EntryRemovedPayload) => {
      if (p.entryId === entryId) {
        getEntry(entryId)
          .then((r) => setEntry(r.entry))
          .catch(() => undefined);
      }
    });
    return () => {
      socket.close();
    };
  }, [entryId]);

  async function handleSubmit() {
    if (!queueId || !displayName.trim()) {
      setError('Escribe tu nombre y elige una cola.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await joinWaitlist(RESTAURANT_CODE, {
        queueId,
        displayName: displayName.trim(),
        partySize,
      });
      setEntry(res.entry);
    } catch {
      setError('No pudimos unirte a la fila. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (entry) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-5 py-10 text-center">
        <WaitingStatus entry={entry} restaurantName={restaurantName} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">Te damos la bienvenida</h1>
        <p className="mt-1 font-body text-muted">{restaurantName || 'Cargando…'}</p>
      </header>

      <Card className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="font-body text-sm font-semibold text-foreground">Tu nombre</span>
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="O usa un apodo divertido"
          />
        </label>

        <div className="flex items-center justify-between">
          <span className="font-body text-sm font-semibold text-foreground">Personas</span>
          <Stepper value={partySize} onChange={setPartySize} />
        </div>

        {queues.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="font-body text-sm font-semibold text-foreground">Cola</span>
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
        )}

        {error && <p className="font-body text-sm text-error">{error}</p>}

        <Button size="lg" className="mt-2 w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Uniéndote…' : 'Unirme a la fila'}
        </Button>
      </Card>

      <Link href="/cuenta" className="text-center font-body text-sm text-primary-dark">
        Crea tu cuenta para guardar tu historial
      </Link>
    </main>
  );
}

function WaitingStatus({
  entry,
  restaurantName,
}: {
  entry: WaitlistEntry;
  restaurantName: string;
}) {
  if (entry.status === 'notified') {
    return (
      <>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-5xl">
          🎉
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">¡Tu mesa está lista!</h1>
          <p className="mt-1 font-body text-muted">Acércate a la recepción de {restaurantName}.</p>
        </div>
        <StatusBadge status={entry.status} />
      </>
    );
  }

  if (entry.status === 'seated') {
    return (
      <>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary/15 text-5xl">
          🍽️
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">¡Buen provecho!</h1>
        <p className="font-body text-muted">Gracias por visitar {restaurantName}.</p>
      </>
    );
  }

  if (entry.status === 'no_show' || entry.status === 'cancelled') {
    return (
      <>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {entry.status === 'cancelled' ? 'Tu lugar se canceló' : 'Tu lugar expiró'}
        </h1>
        <p className="font-body text-muted">Puedes volver a anotarte cuando quieras.</p>
      </>
    );
  }

  // waiting
  return (
    <>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/15 font-display text-3xl font-bold text-secondary-dark">
        {entry.position}
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">¡Estás en la fila!</h1>
        <p className="mt-1 font-body text-muted">Tu lugar en {restaurantName}</p>
      </div>
      <Card className="w-full">
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-muted">Tiempo estimado</span>
          <span className="font-display text-2xl font-bold text-primary-dark">
            {entry.etaMinutes != null ? `~${entry.etaMinutes} min` : '—'}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-body text-sm text-muted">Estado</span>
          <StatusBadge status={entry.status} />
        </div>
      </Card>
      <p className="font-body text-sm text-muted">Te avisaremos cuando tu mesa esté lista.</p>
    </>
  );
}
