'use client';

import { isApiRequestError } from '@nexa/api-client';
import { useApi, useSession } from '@nexa/api-client/react';
import type { Queue } from '@nexa/types';
import { Button, Card, Input } from '@nexa/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { RequireSession } from '../../components/require-session';

export default function ConfigPage() {
  return (
    <RequireSession>
      <Config />
    </RequireSession>
  );
}

/** Turns a failure into the API's message when it has one. */
function message(cause: unknown, fallback: string): string {
  return isApiRequestError(cause) ? cause.message : fallback;
}

function Config() {
  const api = useApi();
  const { restaurant } = useSession();
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [etaBase, setEtaBase] = useState(10);
  const [expiration, setExpiration] = useState(10);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [newQueue, setNewQueue] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) return;
    api.restaurants
      .get(restaurant.code)
      .then((data) => {
        setName(data.restaurant.name);
        setCode(data.restaurant.code);
        setEtaBase(data.restaurant.etaBaseMinutes);
        setExpiration(data.restaurant.expirationMinutes);
        setQueues(data.queues);
        setLoaded(true);
      })
      .catch((cause: unknown) => setStatus(message(cause, 'No se pudo cargar la configuración.')));
  }, [api, restaurant]);

  async function saveConfig() {
    if (!restaurant) return;
    setStatus(null);
    try {
      await api.restaurants.updateConfig(restaurant.code, {
        name,
        etaBaseMinutes: etaBase,
        expirationMinutes: expiration,
      });
      setStatus('Configuración guardada.');
    } catch (cause) {
      setStatus(message(cause, 'Error al guardar la configuración.'));
    }
  }

  async function handleAddQueue() {
    if (!restaurant || !newQueue.trim()) return;
    try {
      const data = await api.restaurants.addQueue(restaurant.code, { name: newQueue.trim() });
      setQueues(data.queues);
      setNewQueue('');
      setStatus('Cola agregada.');
    } catch (cause) {
      setStatus(message(cause, 'Error al agregar la cola.'));
    }
  }

  function renameQueue(id: string, value: string) {
    setQueues((prev) => prev.map((q) => (q.id === id ? { ...q, name: value } : q)));
  }

  async function saveQueue(id: string) {
    const queue = queues.find((q) => q.id === id);
    if (!queue) return;
    try {
      await api.queues.update(id, { name: queue.name });
      setStatus('Cola actualizada.');
    } catch (cause) {
      setStatus(message(cause, 'Error al actualizar la cola.'));
    }
  }

  if (!loaded) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="font-body text-muted">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Configuración</h1>
        <Link href="/" className="font-body text-sm font-semibold text-primary-dark">
          ← Panel
        </Link>
      </div>

      <Card className="mb-4 flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Datos del restaurante
        </h2>
        <label className="flex flex-col gap-1">
          <span className="font-body text-sm text-muted">Nombre</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-sm text-muted">Código de acceso</span>
          <Input value={code} readOnly className="bg-background text-muted" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-body text-sm text-muted">ETA base (min)</span>
            <Input
              type="number"
              value={etaBase}
              onChange={(e) => setEtaBase(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-sm text-muted">Expiración (min)</span>
            <Input
              type="number"
              value={expiration}
              onChange={(e) => setExpiration(Number(e.target.value))}
            />
          </label>
        </div>
        <Button className="self-start" onClick={() => void saveConfig()}>
          Guardar cambios
        </Button>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Colas</h2>
        <ul className="flex flex-col gap-3">
          {queues.map((queue) => (
            <li key={queue.id} className="flex items-center gap-3">
              <Input value={queue.name} onChange={(e) => renameQueue(queue.id, e.target.value)} />
              <Button size="sm" variant="secondary" onClick={() => void saveQueue(queue.id)}>
                Guardar
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Input
            value={newQueue}
            onChange={(e) => setNewQueue(e.target.value)}
            placeholder="Nueva cola (ej. Terraza)"
          />
          <Button size="sm" onClick={() => void handleAddQueue()}>
            Agregar
          </Button>
        </div>
      </Card>

      {status && <p className="mt-4 font-body text-sm text-secondary-dark">{status}</p>}
    </main>
  );
}
