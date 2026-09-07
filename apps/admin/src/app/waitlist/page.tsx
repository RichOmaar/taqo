'use client';

import { isApiRequestError } from '@nexa/api-client';
import { useApi, useSession, useWaitlistSocket } from '@nexa/api-client/react';
import { WAITLIST_STATUSES } from '@nexa/types';
import type { Queue, WaitlistEntry, WaitlistHistoryEntry, WaitlistStatus } from '@nexa/types';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  StatusBadge,
  TopBar,
  type DataTableColumn,
} from '@nexa/ui';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AdminShell } from '../../components/admin-shell';
import { relativeTime } from '../../lib/chart-view';
import {
  STATUS_LABELS,
  csvFilename,
  liveEntries,
  partyLabel,
  toCsv,
  waitLabel,
} from '../../lib/waitlist-view';

const PAGE_SIZE = 25;

export default function WaitlistPage() {
  return (
    <AdminShell>
      <Waitlist />
    </AdminShell>
  );
}

function message(cause: unknown, fallback: string): string {
  return isApiRequestError(cause) ? cause.message : fallback;
}

type Tab = 'live' | 'history';

function Waitlist() {
  const { restaurant } = useSession();
  const [tab, setTab] = useState<Tab>('live');

  return (
    <>
      <TopBar title="Lista de espera" subtitle="La cola en vivo y todo lo que ya pasó por ella." />

      <div className="mb-4 flex flex-wrap gap-2">
        <TabButton label="En vivo" selected={tab === 'live'} onClick={() => setTab('live')} />
        <TabButton
          label="Historial"
          selected={tab === 'history'}
          onClick={() => setTab('history')}
        />
      </div>

      {tab === 'live' ? <LiveBoard /> : <History />}

      {!restaurant && <p className="font-body text-muted">Cargando…</p>}
    </>
  );
}

function LiveBoard() {
  const api = useApi();
  const { restaurant } = useSession();

  const [queues, setQueues] = useState<Queue[]>([]);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { socket, connected } = useWaitlistSocket({
    onEntryAdded: ({ entry }) =>
      setEntries((prev) => (prev.some((row) => row.id === entry.id) ? prev : [...prev, entry])),
    onEntryUpdated: ({ entry }) =>
      setEntries((prev) => prev.map((row) => (row.id === entry.id ? entry : row))),
    onEntryRemoved: ({ entryId }) => setEntries((prev) => prev.filter((row) => row.id !== entryId)),
  });

  useEffect(() => {
    if (!restaurant) return;
    let cancelled = false;

    async function load(code: string, restaurantId: string) {
      const data = await api.restaurants.get(code);
      if (cancelled) return;
      setQueues(data.queues);

      const snapshots = await Promise.all(
        data.queues.map((queue) => api.restaurants.listQueueEntries(restaurantId, queue.id)),
      );
      if (cancelled) return;
      setEntries(snapshots.flatMap((snapshot) => snapshot.entries));
      setLoaded(true);
    }

    load(restaurant.code, restaurant.id).catch((cause: unknown) => {
      if (cancelled) return;
      setError(message(cause, 'No se pudo cargar la cola.'));
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [api, restaurant]);

  // Subscribing is separate from loading: the socket replays these on
  // reconnect, so the board keeps updating after a dropped connection.
  useEffect(() => {
    if (!socket || !restaurant) return;
    for (const queue of queues) socket.subscribeToQueue(restaurant.id, queue.id);
  }, [socket, restaurant, queues]);

  const live = liveEntries(entries);
  const queueName = (id: string) => queues.find((queue) => queue.id === id)?.name ?? '—';

  const columns: DataTableColumn<WaitlistEntry>[] = [
    { key: 'position', header: '#', render: (row) => row.position },
    { key: 'name', header: 'Comensal', render: (row) => row.displayName },
    { key: 'party', header: 'Personas', render: (row) => partyLabel(row.partySize) },
    { key: 'queue', header: 'Cola', render: (row) => queueName(row.queueId), hideOnSmall: true },
    {
      key: 'joined',
      header: 'Esperando desde',
      render: (row) => relativeTime(row.joinedAt),
      hideOnSmall: true,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (error) return <p className="font-body text-sm text-error">{error}</p>;
  if (!loaded) return <p className="font-body text-muted">Cargando la cola…</p>;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          {live.length === 1 ? '1 persona en la fila' : `${live.length} personas en la fila`}
        </h2>
        {/* Stated rather than assumed: a stale board that looks live is worse
            than one that admits it is not updating. */}
        <span className="font-body text-xs text-muted">
          {connected ? 'Actualizando en vivo' : 'Sin conexión en vivo'}
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={live}
        rowKey={(row) => row.id}
        caption="Comensales esperando ahora"
        empty={
          <EmptyState
            title="La fila está vacía"
            description="Cuando alguien se anote, aparecerá aquí al instante."
          />
        }
      />
    </Card>
  );
}

function History() {
  const api = useApi();
  const { restaurant } = useSession();
  const code = restaurant?.code;

  const [entries, setEntries] = useState<WaitlistHistoryEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<WaitlistStatus | null>(null);
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced so a search does not fire a request per keystroke.
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = useCallback(
    () => ({ ...(status ? { status } : {}), ...(term ? { search: term } : {}) }),
    [status, term],
  );

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    setLoaded(false);
    setError(null);

    api.restaurants
      .waitlistHistory(code, { limit: PAGE_SIZE, ...filters() })
      .then((data) => {
        if (cancelled) return;
        setEntries(data.entries);
        setCursor(data.nextCursor);
        setLoaded(true);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(message(cause, 'No se pudo cargar el historial.'));
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [api, code, filters]);

  async function loadMore() {
    if (!code || !cursor) return;
    setLoadingMore(true);
    try {
      const data = await api.restaurants.waitlistHistory(code, {
        limit: PAGE_SIZE,
        cursor,
        ...filters(),
      });
      setEntries((current) => [...current, ...data.entries]);
      setCursor(data.nextCursor);
    } catch (cause) {
      setError(message(cause, 'No se pudieron cargar más entradas.'));
    } finally {
      setLoadingMore(false);
    }
  }

  const columns: DataTableColumn<WaitlistHistoryEntry>[] = [
    { key: 'name', header: 'Comensal', render: (row) => row.displayName },
    { key: 'party', header: 'Personas', render: (row) => partyLabel(row.partySize) },
    { key: 'queue', header: 'Cola', render: (row) => row.queueName, hideOnSmall: true },
    {
      key: 'joined',
      header: 'Se anotó',
      render: (row) => relativeTime(row.joinedAt),
      hideOnSmall: true,
    },
    { key: 'wait', header: 'Espera', render: (row) => waitLabel(row.waitMinutes), align: 'right' },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre"
          aria-label="Buscar por nombre"
          className="max-w-xs"
        />
        <StatusFilter status={status} onChange={setStatus} />
        <ExportButton entries={entries} />
      </div>

      {error && <p className="font-body text-sm text-error">{error}</p>}

      {!loaded ? (
        <p className="font-body text-muted">Cargando historial…</p>
      ) : (
        <Card className="flex flex-col gap-3">
          <DataTable
            columns={columns}
            rows={entries}
            rowKey={(row) => row.id}
            caption="Historial de la lista de espera"
            empty={
              <EmptyState
                title={
                  status || term
                    ? 'Nada coincide con ese filtro'
                    : 'Todavía no hay nada en el historial'
                }
                description={
                  status || term
                    ? 'Prueba con otro nombre o estado.'
                    : 'Cuando tus comensales pasen por la fila, quedarán registrados aquí.'
                }
              />
            }
          />

          {cursor && (
            <Button
              variant="secondary"
              className="self-center"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? 'Cargando…' : 'Ver más'}
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

function StatusFilter({
  status,
  onChange,
}: {
  status: WaitlistStatus | null;
  onChange: (status: WaitlistStatus | null) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="font-body text-sm text-muted">Estado</span>
      <select
        value={status ?? ''}
        onChange={(event) => onChange((event.target.value || null) as WaitlistStatus | null)}
        className="rounded-full border border-border bg-surface px-4 py-2 font-body text-sm text-foreground"
      >
        <option value="">Todos</option>
        {WAITLIST_STATUSES.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABELS[value]}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Exports what is on screen.
 *
 * Deliberately not "export everything": the button promises the rows the
 * owner is looking at, filters included, and a silent full-table download
 * would not be that.
 */
function ExportButton({ entries }: { entries: WaitlistHistoryEntry[] }) {
  const anchor = useRef<HTMLAnchorElement>(null);

  function download() {
    const blob = new Blob([toCsv(entries)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = anchor.current;
    if (!link) return;

    link.href = url;
    link.download = csvFilename(new Date());
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={download} disabled={entries.length === 0}>
        Exportar CSV
      </Button>
      <a ref={anchor} className="hidden" aria-hidden="true" />
    </>
  );
}

function TabButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={
        selected
          ? 'rounded-full border border-primary bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground'
          : 'rounded-full border border-border bg-surface px-4 py-2 font-body text-sm font-semibold text-foreground hover:bg-black/5'
      }
    >
      {label}
    </button>
  );
}
