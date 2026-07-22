import type { GetRestaurantResponse, Queue } from '@nexa/types';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAdmin, type Routes } from '../../testing/harness';
import SettingsPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/configuracion',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

function queue(overrides: Partial<Queue> = {}): Queue {
  return {
    id: 'queue-1',
    restaurantId: 'rest-1',
    name: 'General',
    description: 'Uso para clientes sin reserva',
    priority: 0,
    isActive: true,
    ...overrides,
  };
}

const RESTAURANT: GetRestaurantResponse = {
  restaurant: {
    id: 'rest-1',
    code: 'DEMO',
    name: 'Demo',
    qrToken: 'qr-token',
    etaBaseMinutes: 15,
    expirationMinutes: 10,
    plan: 'free',
    timezone: 'America/Mexico_City',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  queues: [queue(), queue({ id: 'queue-2', name: 'VIP', description: null, priority: 1 })],
};

function open(routes: Routes = {}) {
  return renderAdmin(<SettingsPage />, {
    'GET /restaurants/DEMO': RESTAURANT,
    ...routes,
  });
}

/** The row for a queue, so a control never matches the wrong one. */
function rowFor(name: string) {
  return screen.getByLabelText(`Nombre de ${name}`).closest('li')!;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('settings page', () => {
  it('fills the form from the restaurant', async () => {
    open();

    expect(await screen.findByDisplayValue('Demo')).toBeInTheDocument();
    expect(screen.getByLabelText('Tiempo base (ETA)')).toHaveValue(15);
  });

  it('lists the queues with their descriptions', async () => {
    open();

    expect(await screen.findByDisplayValue('General')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Uso para clientes sin reserva')).toBeInTheDocument();
  });

  describe('saving the configuration', () => {
    it('sends the edited values', async () => {
      const harness = open({ 'PATCH /restaurants/DEMO': { restaurant: RESTAURANT.restaurant } });
      const name = await screen.findByDisplayValue('Demo');

      await userEvent.clear(name);
      await userEvent.type(name, 'Demo Centro');
      await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'PATCH');
        expect(call?.body).toMatchObject({
          name: 'Demo Centro',
          etaBaseMinutes: 15,
          expirationMinutes: 10,
        });
      });
    });

    it('sends the tolerance the slider was moved to', async () => {
      const harness = open({ 'PATCH /restaurants/DEMO': { restaurant: RESTAURANT.restaurant } });
      await screen.findByDisplayValue('Demo');

      // fireEvent, because a range input in jsdom does not respond to typing.
      fireEvent.change(screen.getByLabelText('Margen de tolerancia'), { target: { value: '25' } });
      await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'PATCH');
        expect(call?.body).toMatchObject({ expirationMinutes: 25 });
      });
    });

    it('confirms the save', async () => {
      open({ 'PATCH /restaurants/DEMO': { restaurant: RESTAURANT.restaurant } });
      await screen.findByDisplayValue('Demo');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      expect(await screen.findByText('Configuración guardada.')).toBeInTheDocument();
    });

    it('reports a rejected save rather than claiming success', async () => {
      open({ 'PATCH /restaurants/DEMO': new Error('La espera base no puede ser negativa') });
      await screen.findByDisplayValue('Demo');

      await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

      expect(await screen.findByText(/no puede ser negativa/)).toBeInTheDocument();
    });
  });

  describe('the QR block', () => {
    it('shows the access code', async () => {
      open();

      expect(await screen.findByText('DEMO')).toBeInTheDocument();
    });

    it('does not offer to edit the code, which is printed on QR posters', async () => {
      open();
      await screen.findByText('DEMO');

      expect(screen.queryByDisplayValue('DEMO')).not.toBeInTheDocument();
    });

    it('renders a QR the diner can scan', async () => {
      open();

      expect(
        await screen.findByRole('img', { name: /Código QR para unirse a la fila de DEMO/ }),
      ).toBeInTheDocument();
    });

    it('offers the QR for printing', async () => {
      open();
      await screen.findByRole('img', { name: /Código QR/ });

      expect(screen.getByRole('button', { name: 'Descargar para imprimir' })).toBeEnabled();
    });
  });

  describe('adding a queue', () => {
    const added = { ...RESTAURANT, queues: [...RESTAURANT.queues, queue({ id: 'queue-3' })] };

    it('sends the trimmed name', async () => {
      const harness = open({ 'POST /restaurants/DEMO/queues': added });
      await screen.findByDisplayValue('General');

      await userEvent.type(screen.getByLabelText('Nombre de la nueva cola'), '  Terraza  ');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'POST');
        expect(call?.body).toMatchObject({ name: 'Terraza' });
      });
    });

    it('sends the description when one was written', async () => {
      const harness = open({ 'POST /restaurants/DEMO/queues': added });
      await screen.findByDisplayValue('General');

      await userEvent.type(screen.getByLabelText('Nombre de la nueva cola'), 'Terraza');
      await userEvent.type(screen.getByLabelText('Descripción de la nueva cola'), 'Al aire libre');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'POST');
        expect(call?.body).toMatchObject({ description: 'Al aire libre' });
      });
    });

    it('sends null rather than an empty description', async () => {
      const harness = open({ 'POST /restaurants/DEMO/queues': added });
      await screen.findByDisplayValue('General');

      await userEvent.type(screen.getByLabelText('Nombre de la nueva cola'), 'Terraza');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'POST');
        expect((call?.body as { description: unknown }).description).toBeNull();
      });
    });

    it('clears the fields, so the next queue starts from empty', async () => {
      open({ 'POST /restaurants/DEMO/queues': added });
      await screen.findByDisplayValue('General');

      await userEvent.type(screen.getByLabelText('Nombre de la nueva cola'), 'Terraza');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => expect(screen.getByLabelText('Nombre de la nueva cola')).toHaveValue(''));
    });

    it('does nothing for a blank name', async () => {
      const harness = open();
      await screen.findByDisplayValue('General');

      await userEvent.type(screen.getByLabelText('Nombre de la nueva cola'), '   ');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      expect(harness.calls.some((c) => c.method === 'POST')).toBe(false);
    });
  });

  describe('editing a queue', () => {
    it('saves the queue that was edited, not another one', async () => {
      const harness = open({ 'PATCH /queues/queue-2': { queue: RESTAURANT.queues[1] } });
      const vip = await screen.findByDisplayValue('VIP');

      await userEvent.clear(vip);
      await userEvent.type(vip, 'Terraza VIP');
      await userEvent.click(within(rowFor('Terraza VIP')).getByRole('button', { name: 'Guardar' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.path === '/queues/queue-2');
        expect(call?.body).toMatchObject({ name: 'Terraza VIP' });
      });
    });

    it('saves an edited description', async () => {
      const harness = open({ 'PATCH /queues/queue-1': { queue: RESTAURANT.queues[0] } });
      await screen.findByDisplayValue('General');

      const description = screen.getByLabelText('Descripción de General');
      await userEvent.clear(description);
      await userEvent.type(description, 'Solo sin reserva');
      await userEvent.click(within(rowFor('General')).getByRole('button', { name: 'Guardar' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.path === '/queues/queue-1');
        expect(call?.body).toMatchObject({ description: 'Solo sin reserva' });
      });
    });
  });

  describe('removing a queue', () => {
    it('asks the API to remove the one that was chosen', async () => {
      const harness = open({
        'DELETE /queues/queue-2': { ...RESTAURANT, queues: [queue()], outcome: 'deleted' },
      });
      await screen.findByDisplayValue('VIP');

      await userEvent.click(within(rowFor('VIP')).getByRole('button', { name: 'Eliminar' }));

      await waitFor(() =>
        expect(
          harness.calls.some((c) => c.method === 'DELETE' && c.path === '/queues/queue-2'),
        ).toBe(true),
      );
    });

    it('drops it from the list without a reload', async () => {
      open({ 'DELETE /queues/queue-2': { ...RESTAURANT, queues: [queue()], outcome: 'deleted' } });
      await screen.findByDisplayValue('VIP');

      await userEvent.click(within(rowFor('VIP')).getByRole('button', { name: 'Eliminar' }));

      await waitFor(() => expect(screen.queryByDisplayValue('VIP')).not.toBeInTheDocument());
    });

    it('says the history was kept when the queue was only deactivated', async () => {
      // The two outcomes mean different things to the owner, so they read
      // differently.
      open({
        'DELETE /queues/queue-2': { ...RESTAURANT, queues: [queue()], outcome: 'deactivated' },
      });
      await screen.findByDisplayValue('VIP');

      await userEvent.click(within(rowFor('VIP')).getByRole('button', { name: 'Eliminar' }));

      expect(await screen.findByText(/Se conserva su historial/)).toBeInTheDocument();
    });

    it('does not promise history was kept when the queue was deleted', async () => {
      open({ 'DELETE /queues/queue-2': { ...RESTAURANT, queues: [queue()], outcome: 'deleted' } });
      await screen.findByDisplayValue('VIP');

      await userEvent.click(within(rowFor('VIP')).getByRole('button', { name: 'Eliminar' }));

      expect(await screen.findByText('Cola eliminada.')).toBeInTheDocument();
    });

    it('surfaces the reason the server refused', async () => {
      open({ 'DELETE /queues/queue-2': new Error('This queue still has diners waiting.') });
      await screen.findByDisplayValue('VIP');

      await userEvent.click(within(rowFor('VIP')).getByRole('button', { name: 'Eliminar' }));

      expect(await screen.findByText(/still has diners waiting/)).toBeInTheDocument();
    });

    it('keeps the queue on screen when the server refused', async () => {
      open({ 'DELETE /queues/queue-2': new Error('nope') });
      await screen.findByDisplayValue('VIP');

      await userEvent.click(within(rowFor('VIP')).getByRole('button', { name: 'Eliminar' }));
      await screen.findByText(/nope/);

      expect(screen.getByDisplayValue('VIP')).toBeInTheDocument();
    });
  });

  describe('the logo uploader', () => {
    it('says it is not ready rather than accepting a file it would drop', async () => {
      open();

      expect(await screen.findByText(/Todavía no disponible/)).toBeInTheDocument();
    });

    it('offers no file input at all', async () => {
      open();
      await screen.findByText(/Todavía no disponible/);

      expect(document.querySelector('input[type="file"]')).toBeNull();
    });
  });
});
