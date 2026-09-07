'use client';

import { isApiRequestError } from '@nexa/api-client';
import { useApi, useSession } from '@nexa/api-client/react';
import type { Queue } from '@nexa/types';
import { Button, Card, Input, Slider, TopBar } from '@nexa/ui';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';

import { AdminShell } from '../../components/admin-shell';
import { joinUrl, qrFilename } from '../../lib/qr-view';

export default function SettingsPage() {
  return (
    <AdminShell>
      <Settings />
    </AdminShell>
  );
}

function message(cause: unknown, fallback: string): string {
  return isApiRequestError(cause) ? cause.message : fallback;
}

function Settings() {
  const api = useApi();
  const { restaurant } = useSession();

  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [etaBase, setEtaBase] = useState(10);
  const [expiration, setExpiration] = useState(10);
  const [queues, setQueues] = useState<Queue[]>([]);
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

  if (!loaded) {
    return <p className="font-body text-muted">Cargando…</p>;
  }

  return (
    <>
      <TopBar
        title="Configuración"
        subtitle="Personaliza la experiencia de tus comensales y el flujo de tu local."
        actions={<Button onClick={() => void saveConfig()}>Guardar cambios</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Datos del restaurante
            </h2>
            <label className="flex flex-col gap-1">
              <span className="font-body text-sm text-muted">Nombre</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <LogoPlaceholder />
          </Card>

          <QueuesCard queues={queues} onChange={setQueues} code={code} onStatus={setStatus} />
        </div>

        <div className="flex flex-col gap-4">
          <QrCard code={code} />

          <Card className="flex flex-col gap-2">
            <h2 className="font-display text-base font-semibold text-foreground">
              Tiempo base (ETA)
            </h2>
            <label className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={600}
                value={etaBase}
                onChange={(e) => setEtaBase(Number(e.target.value))}
                className="w-24"
                aria-label="Tiempo base (ETA)"
              />
              <span className="font-body text-sm text-muted">minutos / mesa</span>
            </label>
            <p className="font-body text-xs text-muted">
              Se usa para calcular el tiempo de espera aproximado que ven tus comensales.
            </p>
          </Card>

          <Card className="flex flex-col gap-2">
            <h2 className="font-display text-base font-semibold text-foreground">
              Expiración de turno
            </h2>
            <Slider
              label="Margen de tolerancia"
              value={expiration}
              onChange={setExpiration}
              min={1}
              max={60}
              valueLabel={`${expiration} min`}
              description='Los turnos se marcarán como "No-show" automáticamente después de este tiempo.'
            />
          </Card>
        </div>
      </div>

      {status && <p className="mt-4 font-body text-sm text-secondary-dark">{status}</p>}
    </>
  );
}

/**
 * The mock shows a logo uploader.
 *
 * Stated rather than faked: there is no file storage yet, and a control that
 * appears to accept a logo and quietly drops it is worse than one that says
 * it is not ready.
 */
function LogoPlaceholder() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-3">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl"
      >
        🏙️
      </span>
      <div className="flex flex-col">
        <span className="font-body text-sm font-semibold text-foreground">Logotipo</span>
        <span className="font-body text-xs text-muted">
          Todavía no disponible: falta definir dónde se guardan los archivos.
        </span>
      </div>
    </div>
  );
}

function QrCard({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const anchor = useRef<HTMLAnchorElement>(null);
  const url = code ? joinUrl(code) : '';

  useEffect(() => {
    if (!url) return;
    let live = true;
    QRCode.toString(url, { type: 'svg', margin: 1, width: 220 })
      .then((markup) => {
        if (live) setSvg(markup);
      })
      .catch(() => setSvg(null));
    return () => {
      live = false;
    };
  }, [url]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is permission-gated; the code is on screen either way.
    }
  }

  function download() {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const href = URL.createObjectURL(blob);
    const link = anchor.current;
    if (!link) return;
    link.href = href;
    link.download = qrFilename(code);
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <Card className="flex flex-col items-center gap-3 bg-secondary/10">
      <h2 className="self-start font-display text-base font-semibold text-secondary-dark">
        QR de bienvenida
      </h2>

      {svg ? (
        <div
          className="rounded-2xl bg-surface p-3 [&>svg]:h-auto [&>svg]:w-full"
          // The markup is generated locally from the restaurant's own code,
          // never from anything a diner can write.
          dangerouslySetInnerHTML={{ __html: svg }}
          role="img"
          aria-label={`Código QR para unirse a la fila de ${code}`}
        />
      ) : (
        <div className="h-40 w-40 animate-pulse rounded-2xl bg-surface" />
      )}

      <span className="font-body text-xs tracking-wide text-muted uppercase">Código de acceso</span>
      <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2">
        <span className="font-display text-lg font-bold text-primary-dark">{code}</span>
        <button
          type="button"
          onClick={() => void copyCode()}
          aria-label="Copiar código de acceso"
          className="font-body text-sm text-muted hover:text-foreground"
        >
          {copied ? '✓' : '⧉'}
        </button>
      </div>

      <Button variant="secondary" className="w-full" onClick={download} disabled={!svg}>
        Descargar para imprimir
      </Button>
      <a ref={anchor} className="hidden" aria-hidden="true" />
    </Card>
  );
}

function QueuesCard({
  queues,
  onChange,
  code,
  onStatus,
}: {
  queues: Queue[];
  onChange: (queues: Queue[]) => void;
  code: string;
  onStatus: (message: string) => void;
}) {
  const api = useApi();
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function add() {
    if (!newName.trim()) return;
    try {
      const data = await api.restaurants.addQueue(code, {
        name: newName.trim(),
        description: newDescription.trim() || null,
      });
      onChange(data.queues);
      setNewName('');
      setNewDescription('');
      onStatus('Cola agregada.');
    } catch (cause) {
      onStatus(message(cause, 'Error al agregar la cola.'));
    }
  }

  async function save(queue: Queue) {
    setBusy(queue.id);
    try {
      await api.queues.update(queue.id, {
        name: queue.name,
        description: queue.description,
      });
      onStatus('Cola actualizada.');
    } catch (cause) {
      onStatus(message(cause, 'Error al actualizar la cola.'));
    } finally {
      setBusy(null);
    }
  }

  async function remove(queue: Queue) {
    setBusy(queue.id);
    try {
      const result = await api.queues.remove(queue.id);
      onChange(result.queues);
      onStatus(
        result.outcome === 'deactivated'
          ? 'Cola desactivada. Se conserva su historial, pero ya no se puede elegir.'
          : 'Cola eliminada.',
      );
    } catch (cause) {
      onStatus(message(cause, 'No se pudo eliminar la cola.'));
    } finally {
      setBusy(null);
    }
  }

  function edit(id: string, patch: Partial<Queue>) {
    onChange(queues.map((queue) => (queue.id === id ? { ...queue, ...patch } : queue)));
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold text-foreground">Gestión de filas</h2>

      <ul className="flex flex-col gap-3">
        {queues.map((queue) => (
          <li key={queue.id} className="flex flex-col gap-2 rounded-2xl border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={queue.name}
                onChange={(e) => edit(queue.id, { name: e.target.value })}
                aria-label={`Nombre de ${queue.name}`}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void save(queue)}
                disabled={busy === queue.id}
              >
                Guardar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void remove(queue)}
                disabled={busy === queue.id}
              >
                Eliminar
              </Button>
            </div>
            <Input
              value={queue.description ?? ''}
              onChange={(e) => edit(queue.id, { description: e.target.value || null })}
              placeholder="Descripción (ej. Consumo rápido o barra)"
              aria-label={`Descripción de ${queue.name}`}
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nueva cola (ej. Terraza)"
            aria-label="Nombre de la nueva cola"
            className="flex-1"
          />
          <Button size="sm" onClick={() => void add()}>
            Agregar
          </Button>
        </div>
        <Input
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          aria-label="Descripción de la nueva cola"
        />
      </div>
    </Card>
  );
}
