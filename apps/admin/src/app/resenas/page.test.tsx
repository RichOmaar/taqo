import type { ListReviewsResponse, RestaurantReview, ReviewSummaryResponse } from '@nexa/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAdmin, type Routes } from '../../testing/harness';
import ReviewsPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/resenas',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

function review(overrides: Partial<RestaurantReview> = {}): RestaurantReview {
  return {
    id: 'rev-1',
    entryId: 'entry-1',
    displayName: 'Ana',
    rating: 5,
    feedback: 'Excelente servicio',
    createdAt: '2026-07-21T12:00:00.000Z',
    ...overrides,
  };
}

const SUMMARY: ReviewSummaryResponse = {
  average: 4.2,
  total: 10,
  distribution: [
    { rating: 5, count: 5 },
    { rating: 4, count: 2 },
    { rating: 3, count: 1 },
    { rating: 2, count: 1 },
    { rating: 1, count: 1 },
  ],
  range: { from: '2026-06-21T06:00:00.000Z', to: '2026-07-22T06:00:00.000Z' },
};

const LIST: ListReviewsResponse = { reviews: [review()], nextCursor: null };

function open(routes: Routes = {}) {
  return renderAdmin(<ReviewsPage />, {
    'GET /restaurants/DEMO/reviews/summary': SUMMARY,
    'GET /restaurants/DEMO/reviews': LIST,
    ...routes,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('reviews page', () => {
  it('shows the average rating', async () => {
    open();

    expect(await screen.findByText('4.2')).toBeInTheDocument();
  });

  it('shows how many reviews there are', async () => {
    open();

    expect(await screen.findByText('Reseñas recibidas')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('reports the share of diners who were happy', async () => {
    // 7 of 10 gave four stars or more.
    open();

    expect(await screen.findByText('70%')).toBeInTheDocument();
  });

  it('lists the reviews', async () => {
    open();

    expect(await screen.findByText(/Excelente servicio/)).toBeInTheDocument();
  });

  describe('the breakdown', () => {
    it('shows a row per rating, including ones nobody gave', async () => {
      open({
        'GET /restaurants/DEMO/reviews/summary': {
          ...SUMMARY,
          total: 5,
          distribution: [{ rating: 5, count: 5 }],
        },
      });
      const card = await screen.findByText('Cómo se reparten');
      const section = card.parentElement!;

      expect(within(section).getByText('1 ★')).toBeInTheDocument();
      expect(within(section).getByText('5 reseñas')).toBeInTheDocument();
    });

    it('is hidden when there is nothing to break down', async () => {
      open({
        'GET /restaurants/DEMO/reviews/summary': { ...SUMMARY, total: 0, distribution: [] },
        'GET /restaurants/DEMO/reviews': { reviews: [], nextCursor: null },
      });
      await screen.findByText('Todavía no hay reseñas');

      expect(screen.queryByText('Cómo se reparten')).not.toBeInTheDocument();
    });
  });

  describe('filtering by rating', () => {
    it('asks the API for that rating only', async () => {
      const harness = open();
      await screen.findByText(/Excelente servicio/);

      await userEvent.click(screen.getByRole('button', { name: '1 ★' }));

      await waitFor(() => {
        const call = harness.calls.filter((c) => c.path === '/restaurants/DEMO/reviews').at(-1);
        expect(call?.query).toContain('rating=1');
      });
    });

    it('sends no rating for "todas"', async () => {
      const harness = open();
      await screen.findByText(/Excelente servicio/);
      await userEvent.click(screen.getByRole('button', { name: '1 ★' }));
      await waitFor(() => expect(harness.calls.length).toBeGreaterThan(2));

      await userEvent.click(screen.getByRole('button', { name: 'Todas' }));

      await waitFor(() => {
        const call = harness.calls.filter((c) => c.path === '/restaurants/DEMO/reviews').at(-1);
        expect(call?.query).not.toContain('rating=');
      });
    });

    it('does not re-request the summary, which describes every review', async () => {
      const harness = open();
      await screen.findByText(/Excelente servicio/);

      await userEvent.click(screen.getByRole('button', { name: '2 ★' }));
      await waitFor(() =>
        expect(harness.calls.filter((c) => c.path.endsWith('/reviews')).length).toBeGreaterThan(1),
      );

      expect(harness.calls.filter((c) => c.path.endsWith('/reviews/summary'))).toHaveLength(1);
    });

    it('says the filter found nothing, not that there are no reviews at all', async () => {
      const harness = open();
      await screen.findByText(/Excelente servicio/);

      harness.setRoutes({ 'GET /restaurants/DEMO/reviews': { reviews: [], nextCursor: null } });
      await userEvent.click(screen.getByRole('button', { name: '3 ★' }));

      expect(await screen.findByText('Ninguna reseña de 3 estrellas')).toBeInTheDocument();
    });
  });

  describe('paging', () => {
    it('offers more only while the server says there are more', async () => {
      open();
      await screen.findByText(/Excelente servicio/);

      expect(screen.queryByRole('button', { name: 'Ver más reseñas' })).not.toBeInTheDocument();
    });

    it('appends the next page rather than replacing what is read', async () => {
      const harness = open({
        'GET /restaurants/DEMO/reviews': { reviews: [review()], nextCursor: 'cursor-2' },
      });
      await screen.findByText(/Excelente servicio/);

      harness.setRoutes({
        'GET /restaurants/DEMO/reviews': {
          reviews: [review({ id: 'rev-2', displayName: 'Beto', feedback: 'Muy buena atención' })],
          nextCursor: null,
        },
      });
      await userEvent.click(screen.getByRole('button', { name: 'Ver más reseñas' }));

      expect(await screen.findByText(/Muy buena atención/)).toBeInTheDocument();
      expect(screen.getByText(/Excelente servicio/)).toBeInTheDocument();
    });

    it('passes the cursor the server handed back', async () => {
      const harness = open({
        'GET /restaurants/DEMO/reviews': { reviews: [review()], nextCursor: 'cursor-2' },
      });
      await screen.findByText(/Excelente servicio/);

      await userEvent.click(screen.getByRole('button', { name: 'Ver más reseñas' }));

      await waitFor(() => {
        const call = harness.calls.filter((c) => c.path === '/restaurants/DEMO/reviews').at(-1);
        expect(call?.query).toContain('cursor=cursor-2');
      });
    });

    it('keeps the rating filter while paging', async () => {
      const harness = open({
        'GET /restaurants/DEMO/reviews': { reviews: [review()], nextCursor: 'cursor-2' },
      });
      await screen.findByText(/Excelente servicio/);
      await userEvent.click(screen.getByRole('button', { name: '5 ★' }));
      await screen.findByRole('button', { name: 'Ver más reseñas' });

      await userEvent.click(screen.getByRole('button', { name: 'Ver más reseñas' }));

      await waitFor(() => {
        const call = harness.calls.filter((c) => c.path === '/restaurants/DEMO/reviews').at(-1);
        expect(call?.query).toContain('rating=5');
        expect(call?.query).toContain('cursor=cursor-2');
      });
    });
  });

  it('reports a failed list rather than an empty one', async () => {
    open({ 'GET /restaurants/DEMO/reviews': new Error('Sesión expirada') });

    expect(await screen.findByText(/Sesión expirada/)).toBeInTheDocument();
  });

  it('still lists the reviews when the summary fails', async () => {
    // Independent requests: a broken summary must not cost the owner the list.
    open({ 'GET /restaurants/DEMO/reviews/summary': new Error('boom') });

    expect(await screen.findByText(/Excelente servicio/)).toBeInTheDocument();
  });
});
