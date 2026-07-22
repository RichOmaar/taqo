import type { GetRestaurantResponse } from '@nexa/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAdmin, type Routes } from '../../testing/harness';
import SettingsPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/configuracion',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

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
  queues: [
    { id: 'queue-1', restaurantId: 'rest-1', name: 'General', priority: 0, isActive: true },
    { id: 'queue-2', restaurantId: 'rest-1', name: 'VIP', priority: 1, isActive: true },
  ],
};

function open(routes: Routes = {}) {
  return renderAdmin(<SettingsPage />, {
    'GET /restaurants/DEMO': RESTAURANT,
    ...routes,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('settings page', () => {
  it('fills the form from the restaurant', async () => {
    open();

    expect(await screen.findByDisplayValue('Demo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
  });

  it('lists the queues', async () => {
    open();

    expect(await screen.findByDisplayValue('General')).toBeInTheDocument();
    expect(screen.getByDisplayValue('VIP')).toBeInTheDocument();
  });

  it('keeps the access code read-only, since it is on printed QR codes', async () => {
    open();

    expect(await screen.findByDisplayValue('DEMO')).toHaveAttribute('readonly');
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

  describe('adding a queue', () => {
    const added = {
      ...RESTAURANT,
      queues: [
        ...RESTAURANT.queues,
        { id: 'queue-3', restaurantId: 'rest-1', name: 'Terraza', priority: 2, isActive: true },
      ],
    };

    it('sends the trimmed name', async () => {
      const harness = open({ 'POST /restaurants/DEMO/queues': added });
      await screen.findByDisplayValue('General');

      await userEvent.type(screen.getByPlaceholderText(/Nueva cola/), '  Terraza  ');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.method === 'POST');
        expect(call?.body).toEqual({ name: 'Terraza' });
      });
    });

    it('shows the new queue without a reload', async () => {
      open({ 'POST /restaurants/DEMO/queues': added });
      await screen.findByDisplayValue('General');

      await userEvent.type(screen.getByPlaceholderText(/Nueva cola/), 'Terraza');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      expect(await screen.findByDisplayValue('Terraza')).toBeInTheDocument();
    });

    it('clears the field, so the next queue starts from empty', async () => {
      open({ 'POST /restaurants/DEMO/queues': added });
      await screen.findByDisplayValue('General');

      await userEvent.type(screen.getByPlaceholderText(/Nueva cola/), 'Terraza');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => expect(screen.getByPlaceholderText(/Nueva cola/)).toHaveValue(''));
    });

    it('does nothing for a blank name', async () => {
      const harness = open();
      await screen.findByDisplayValue('General');

      await userEvent.type(screen.getByPlaceholderText(/Nueva cola/), '   ');
      await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));

      expect(harness.calls.some((c) => c.method === 'POST')).toBe(false);
    });
  });

  describe('renaming a queue', () => {
    it('saves the queue that was edited, not another one', async () => {
      const harness = open({ 'PATCH /queues/queue-2': { queue: RESTAURANT.queues[1] } });
      const vip = await screen.findByDisplayValue('VIP');

      await userEvent.clear(vip);
      await userEvent.type(vip, 'Terraza VIP');
      // The second row's own save button.
      const vipRow = screen.getAllByRole('listitem')[1]!;
      await userEvent.click(within(vipRow).getByRole('button', { name: 'Guardar' }));

      await waitFor(() => {
        const call = harness.calls.find((c) => c.path === '/queues/queue-2');
        expect(call?.body).toEqual({ name: 'Terraza VIP' });
      });
    });
  });
});
