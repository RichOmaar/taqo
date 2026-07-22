import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RESTAURANT, renderAdmin, type Routes } from '../../testing/harness';
import PlanPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/plan',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

function open(plan: string = 'free', routes: Routes = {}) {
  return renderAdmin(<PlanPage />, {
    'GET /me': {
      user: { id: 'u1', name: 'Dueña', email: 'owner@demo.nexa' },
      restaurant: { ...RESTAURANT, plan },
    },
    ...routes,
  });
}

/** The card for a plan, so a control never matches the wrong one. */
function cardFor(name: string) {
  return screen.getByRole('heading', { name }).closest('div[class*="flex"]')!.parentElement!;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('plan page', () => {
  it('shows both plans', async () => {
    open();

    expect(await screen.findByRole('heading', { name: 'Gratis' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
  });

  it('shows what each one costs', async () => {
    open();

    expect(await screen.findByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$499')).toBeInTheDocument();
  });

  it('lists what the paid plan adds', async () => {
    open();

    expect(await screen.findByText('Notificaciones SMS y WhatsApp')).toBeInTheDocument();
  });

  describe('marking the current plan', () => {
    it('marks the free plan when the restaurant is on it', async () => {
      open('free');
      await screen.findByRole('heading', { name: 'Gratis' });

      expect(within(cardFor('Gratis')).getByText('Plan actual')).toBeInTheDocument();
    });

    it('marks the paid plan when the restaurant is on it', async () => {
      open('paid');
      await screen.findByRole('heading', { name: 'Pro' });

      expect(within(cardFor('Pro')).getByText('Plan actual')).toBeInTheDocument();
    });

    it('marks only one of them', async () => {
      open('free');
      await screen.findByRole('heading', { name: 'Gratis' });

      expect(screen.getAllByText('Plan actual')).toHaveLength(1);
    });

    it('calls the paid plan an upgrade from free', async () => {
      open('free');
      await screen.findByRole('heading', { name: 'Pro' });

      expect(screen.getByRole('button', { name: 'Mejorar a Pro' })).toBeInTheDocument();
    });

    it('does not call it an upgrade when it is already current', async () => {
      open('paid');
      await screen.findByRole('heading', { name: 'Pro' });

      expect(screen.queryByRole('button', { name: 'Mejorar a Pro' })).not.toBeInTheDocument();
    });
  });

  describe('changing plan', () => {
    it('offers no working control, since there is no payment provider', async () => {
      // A button that looks like it charges and then does nothing is worse
      // than one that says where to go.
      open('free');
      await screen.findByRole('heading', { name: 'Pro' });

      expect(screen.getByRole('button', { name: 'Mejorar a Pro' })).toBeDisabled();
    });

    it('says how to actually change it', async () => {
      open('free');

      expect(await screen.findByText(/Escríbenos para cambiar de plan/)).toBeInTheDocument();
    });

    it('does not offer to change the plan already in use', async () => {
      open('free');
      await screen.findByRole('heading', { name: 'Gratis' });

      expect(within(cardFor('Gratis')).queryByText(/Escríbenos/)).not.toBeInTheDocument();
    });
  });

  describe('the usage panel', () => {
    it('says why there are no meters instead of showing zeroes', async () => {
      // "0 enviadas" would read as "you sent none"; the truth is we do not
      // record them at all.
      open();

      expect(await screen.findByText(/todavía no están disponibles/)).toBeInTheDocument();
    });

    it('shows no numbers that would be invented', async () => {
      open();
      const panel = (await screen.findByText('Uso actual')).closest('div')!.parentElement!;

      expect(within(panel).queryByText(/^\d+$/)).not.toBeInTheDocument();
    });

    it('names the period being covered', async () => {
      open();

      expect(await screen.findByText(/Periodo: \w+ de \d{4}/)).toBeInTheDocument();
    });
  });
});
