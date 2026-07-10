'use client';

import type { Queue } from '@nexa/types';
import { Button, Card, Input } from '@nexa/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { addQueue, getRestaurant, updateConfig, updateQueue } from '../../lib/api';
import { getToken } from '../../lib/auth';

const CODE = 'DEMO';

export default function ConfigPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [etaBase, setEtaBase] = useState(10);
  const [expiration, setExpiration] = useState(10);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [newQueue, setNewQueue] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function refresh() {
    const data = await getRestaurant(CODE);
    setName(data.restaurant.name);
    setCode(data.restaurant.code);
    setEtaBase(data.restaurant.etaBaseMinutes);
    setExpiration(data.restaurant.expirationMinutes);
    setQueues(data.queues);
    setLoaded(true);
  }

  useEffect(() => {
    refresh().catch(() => setStatus('No se pudo cargar la configuración.'));
  }, []);

  async function saveConfig() {
    setStatus(null);
    try {
      await updateConfig(CODE, { name, etaBaseMinutes: etaBase, expirationMinutes: expiration });
      setStatus('Configuración guardada.');
    } catch {
      setStatus('Error al guardar la configuración.');
    }
  }

  async function handleAddQueue() {
    if (!newQueue.trim()) return;
    try {
      const data = await addQueue(CODE, { name: newQueue.trim() });
      setQueues(data.queues);
      setNewQueue('');
      setStatus('Cola agregada.');
    } catch {
      setStatus('Error al agregar la cola.');
    }
  }

  function renameQueue(id: string, value: string) {
    setQueues((prev) => prev.map((q) => (q.id === id ? { ...q, name: value } : q)));
  }

  async function saveQueue(id: string) {
    const queue = queues.find((q) => q.id === id);
    if (!queue) return;
    try {
      await updateQueue(id, { name: queue.name });
      setStatus('Cola actualizada.');
    } catch {
      setStatus('Error al actualizar la cola.');
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
