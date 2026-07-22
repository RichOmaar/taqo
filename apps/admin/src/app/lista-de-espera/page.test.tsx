import type {
  GetRestaurantResponse,
  ListWaitlistHistoryResponse,
  WaitlistHistoryEntry,
} from '@nexa/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAdmin, type Routes } from '../../testing/harness';
import WaitlistPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/lista-de-espera',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const subscribeToQueue = vi.fn();
vi.mock('@nexa/api-client/react', async () => {
  const actual =
    await vi.importActual<typeof import('@nexa/api-client/react')>('@nexa/api-client/react');
  return {
    ...actual,
    useWaitlistSocket: () => ({ socket: { subscribeToQueue }, connected: true }),
  };
});

const RESTAURANT: GetRestaurantResponse = {
  restaurant: {
    id: 'rest-1',
    code: 'DEMO',
    name: 'Demo',
    qrToken: 'qr',
    etaBaseMinutes: 15,
    expirationMinutes: 10,
    plan: 'free',
    timezone: 'America/Mexico_City',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  queues: [{ id: 'queue-1', restaurantId: 'rest-1', name: 'General', description: null, priority: 0, isActive: true }],
};

function liveEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'e1',
    queueId: 'queue-1',
    restaurantId: 'rest-1',
    userId: null,
    displayName: 'Ana',
    partySize: 2,
    phone: null,
    status: 'waiting',
    position: 1,
    etaMinutes: 10,
    etaIsManual: false,
    formData: {},
    joinedAt: '2026-07-21T12:00:00.000Z',
    notifiedAt: null,
    seatedAt: null,
    ...overrides,
  };
}

function historyEntry(overrides: Partial<WaitlistHistoryEntry> = {}): WaitlistHistoryEntry {
  return {
    id: 'h1',
    queueId: 'queue-1',
    queueName: 'General',
    displayName: 'Ana',
    partySize: 2,
    status: 'seated',
    joinedAt: '2026-07-21T12:00:00.000Z',
    notifiedAt: null,
    seatedAt: '2026-07-21T12:12:00.000Z',
    waitMinutes: 12,
    ...overrides,
  };
}

const HISTORY: ListWaitlistHistoryResponse = {
  entries: [historyEntry()],
  nextCursor: null,
};

function open(routes: Routes = {}) {
  return renderAdmin(<WaitlistPage />, {
    'GET /restaurants/DEMO': RESTAURANT,
    'GET /restaurants/rest-1/queues/queue-1/entries': { entries: [liveEntry()] },
    'GET /restaurants/DEMO/waitlist/history': HISTORY,
    ...routes,
  });
}

async function openHistory(routes: Routes = {}) {
  const harness = open(routes);
  await screen.findByText('Ana');
  await userEvent.click(screen.getByRole('button', { name: 'Historial' }));
  return harness;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('the live board', () => {
  it('lists who is waiting now', async () => {
    open();

    expect(await screen.findByText('Ana')).toBeInTheDocument();
  });

  it('counts the queue', async () => {
    open();

    expect(await screen.findByText('1 persona en la fila')).toBeInTheDocument();
  });

  it('leaves out diners who already sat down', async () => {
    open({
      'GET /restaurants/rest-1/queues/queue-1/entries': {
        entries: [liveEntry(), liveEntry({ id: 'e2', displayName: 'Beto', status: 'seated' })],
      },
    });
    await screen.findByText('Ana');

    expect(screen.queryByText('Beto')).not.toBeInTheDocument();
  });

  it('leaves out no-shows', async () => {
    open({
      'GET /restaurants/rest-1/queues/queue-1/entries': {
        entries: [liveEntry({ id: 'e2', displayName: 'Beto', status: 'no_show' })],
      },
    });

    expect(await screen.findByText('La fila está vacía')).toBeInTheDocument();
  });

  it('subscribes to the queue, so the board keeps moving', async () => {
    open();
    await screen.findByText('Ana');

    await waitFor(() => expect(subscribeToQueue).toHaveBeenCalledWith('rest-1', 'queue-1'));
  });

  it('says when the board is live', async () => {
    open();

    expect(await screen.findByText('Actualizando en vivo')).toBeInTheDocument();
  });

  it('says the queue is empty rather than showing a bare table', async () => {
    open({ 'GET /restaurants/rest-1/queues/queue-1/entries': { entries: [] } });

    expect(await screen.findByText('La fila está vacía')).toBeInTheDocument();
  });

  it('reports a failed load', async () => {
    open({ 'GET /restaurants/DEMO': new Error('Sesión expirada') });

    expect(await screen.findByText(/Sesión expirada/)).toBeInTheDocument();
  });
});

describe('the history', () => {
  it('lists past entries', async () => {
    await openHistory();

    expect(await screen.findByText('Ana')).toBeInTheDocument();
  });

  it('shows how long the diner waited', async () => {
    await openHistory();

    expect(await screen.findByText('12 min')).toBeInTheDocument();
  });

  it('shows a dash for a wait nobody served', async () => {
    await openHistory({
      'GET /restaurants/DEMO/waitlist/history': {
        entries: [historyEntry({ status: 'no_show', seatedAt: null, waitMinutes: null })],
        nextCursor: null,
      },
    });

    expect(await screen.findByText('—')).toBeInTheDocument();
  });

  describe('filtering', () => {
    it('asks the API for the chosen status', async () => {
      const harness = await openHistory();
      await screen.findByText('Ana');

      await userEvent.selectOptions(screen.getByLabelText('Estado'), 'no_show');

      await waitFor(() => {
        const call = harness.calls.filter((c) => c.path.endsWith('/waitlist/history')).at(-1);
        expect(call?.query).toContain('status=no_show');
      });
    });

    it('sends no status for "todos"', async () => {
      const harness = await openHistory();
      await userEvent.selectOptions(screen.getByLabelText('Estado'), 'no_show');
      await waitFor(() =>
        expect(
          harness.calls.filter((c) => c.path.endsWith('/waitlist/history')).at(-1)?.query,
        ).toContain('status='),
      );

      await userEvent.selectOptions(screen.getByLabelText('Estado'), '');

      await waitFor(() => {
        const call = harness.calls.filter((c) => c.path.endsWith('/waitlist/history')).at(-1);
        expect(call?.query).not.toContain('status=');
      });
    });

    it('searches by name', async () => {
      const harness = await openHistory();
      await screen.findByText('Ana');

      await userEvent.type(screen.getByLabelText('Buscar por nombre'), 'Beto');

      await waitFor(
        () => {
          const call = harness.calls.filter((c) => c.path.endsWith('/waitlist/history')).at(-1);
          expect(call?.query).toContain('search=Beto');
        },
        { timeout: 2000 },
      );
    });

    it('does not fire a request per keystroke', async () => {
      const harness = await openHistory();
      await screen.findByText('Ana');
      const before = harness.calls.filter((c) => c.path.endsWith('/waitlist/history')).length;

      await userEvent.type(screen.getByLabelText('Buscar por nombre'), 'Beto');

      // Four characters, at most one more request once the debounce settles.
      await waitFor(
        () => {
          const after = harness.calls.filter((c) => c.path.endsWith('/waitlist/history')).length;
          expect(after).toBeLessThanOrEqual(before + 1);
        },
        { timeout: 2000 },
      );
    });

    it('says the filter found nothing, not that the history is empty', async () => {
      const harness = await openHistory();
      await screen.findByText('Ana');

      harness.setRoutes({
        'GET /restaurants/DEMO/waitlist/history': { entries: [], nextCursor: null },
      });
      await userEvent.selectOptions(screen.getByLabelText('Estado'), 'cancelled');

      expect(await screen.findByText('Nada coincide con ese filtro')).toBeInTheDocument();
    });
  });

  describe('paging', () => {
    it('offers more only while the server says there is more', async () => {
      await openHistory();
      await screen.findByText('Ana');

      expect(screen.queryByRole('button', { name: 'Ver más' })).not.toBeInTheDocument();
    });

    it('appends the next page rather than replacing it', async () => {
      const harness = await openHistory({
        'GET /restaurants/DEMO/waitlist/history': {
          entries: [historyEntry()],
          nextCursor: 'cursor-2',
        },
      });
      await screen.findByText('Ana');

      harness.setRoutes({
        'GET /restaurants/DEMO/waitlist/history': {
          entries: [historyEntry({ id: 'h2', displayName: 'Beto' })],
          nextCursor: null,
        },
      });
      await userEvent.click(screen.getByRole('button', { name: 'Ver más' }));

      expect(await screen.findByText('Beto')).toBeInTheDocument();
      expect(screen.getByText('Ana')).toBeInTheDocument();
    });

    it('keeps the status filter while paging', async () => {
      const harness = await openHistory({
        'GET /restaurants/DEMO/waitlist/history': {
          entries: [historyEntry()],
          nextCursor: 'cursor-2',
        },
      });
      await screen.findByText('Ana');
      await userEvent.selectOptions(screen.getByLabelText('Estado'), 'seated');
      await screen.findByRole('button', { name: 'Ver más' });

      await userEvent.click(screen.getByRole('button', { name: 'Ver más' }));

      await waitFor(() => {
        const call = harness.calls.filter((c) => c.path.endsWith('/waitlist/history')).at(-1);
        expect(call?.query).toContain('status=seated');
        expect(call?.query).toContain('cursor=cursor-2');
      });
    });
  });

  describe('export', () => {
    it('is offered when there is something to export', async () => {
      await openHistory();
      await screen.findByText('Ana');

      expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
    });

    it('is refused when there is nothing, rather than writing an empty file', async () => {
      await openHistory({
        'GET /restaurants/DEMO/waitlist/history': { entries: [], nextCursor: null },
      });

      expect(await screen.findByRole('button', { name: 'Exportar CSV' })).toBeDisabled();
    });
  });

  it('reports a failed load', async () => {
    await openHistory({
      'GET /restaurants/DEMO/waitlist/history': new Error('Consulta inválida'),
    });

    expect(await screen.findByText(/Consulta inválida/)).toBeInTheDocument();
  });
});

describe('the tabs', () => {
  it('opens on the live board', async () => {
    open();

    expect(await screen.findByText('Actualizando en vivo')).toBeInTheDocument();
  });

  it('does not fetch the history until it is asked for', async () => {
    const harness = open();
    await screen.findByText('Ana');

    expect(harness.calls.some((c) => c.path.endsWith('/waitlist/history'))).toBe(false);
  });

  it('marks the open tab, not by colour alone', async () => {
    open();
    await screen.findByText('Ana');

    const tabs = screen.getByRole('button', { name: 'En vivo' });
    expect(tabs).toHaveAttribute('aria-pressed', 'true');
    expect(within(document.body).getByRole('button', { name: 'Historial' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
