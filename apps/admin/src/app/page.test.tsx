import type {
  GetMetricsSeriesResponse,
  ListReviewsResponse,
  RestaurantMetrics,
} from '@nexa/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderAdmin, type Routes } from '../testing/harness';
import DashboardPage from './page';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

function metrics(overrides: Partial<RestaurantMetrics> = {}): RestaurantMetrics {
  return {
    averageWaitMinutes: 18,
    seatedCount: 12,
    peopleJoined: 20,
    noShowRate: 0.1,
    seatedConversion: 0.8,
    resolvedCount: 15,
    averageRating: 4.5,
    reviewCount: 8,
    ...overrides,
  };
}

// Typed on purpose: an untyped fixture silently drifts from the API contract,
// and the page then fails for a reason that has nothing to do with the page.
const SERIES: GetMetricsSeriesResponse = {
  timezone: 'America/Mexico_City',
  bucket: 'hour',
  range: { from: '2026-07-21T06:00:00.000Z', to: '2026-07-22T06:00:00.000Z' },
  points: [
    { at: '2026-07-21T13:00:00.000Z', joined: 4, seated: 3 },
    { at: '2026-07-21T14:00:00.000Z', joined: 6, seated: 5 },
  ],
};

const REVIEWS: ListReviewsResponse = {
  reviews: [
    {
      id: 'rev-1',
      entryId: 'entry-1',
      rating: 5,
      feedback: 'Excelente servicio',
      displayName: 'Ana',
      createdAt: '2026-07-21T12:00:00.000Z',
    },
  ],
  nextCursor: null,
};

function open(routes: Routes = {}) {
  return renderAdmin(<DashboardPage />, {
    'GET /restaurants/DEMO/metrics': { metrics: metrics() },
    'GET /restaurants/DEMO/metrics/timeseries': SERIES,
    'GET /restaurants/DEMO/metrics/peak-hours': { timezone: 'America/Mexico_City', cells: [] },
    'GET /restaurants/DEMO/reviews': { reviews: [], nextCursor: null },
    ...routes,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dashboard', () => {
  it('shows the KPI row once the metrics arrive', async () => {
    open();

    expect(await screen.findByText('Espera promedio')).toBeInTheDocument();
  });

  it('says it is loading rather than showing an empty panel', () => {
    open({ 'GET /restaurants/DEMO/metrics': new Promise(() => undefined) });

    expect(screen.queryByText('Todavía no hay actividad')).not.toBeInTheDocument();
  });

  it('reports a metrics failure instead of a blank panel', async () => {
    open({ 'GET /restaurants/DEMO/metrics': new Error('No se pudieron cargar las métricas.') });

    expect(await screen.findByText(/No se pudieron cargar las métricas/)).toBeInTheDocument();
  });

  it('keeps the KPIs when the chart data fails', async () => {
    // The four requests are deliberately independent; one bad response must
    // not cost the owner the whole screen.
    open({ 'GET /restaurants/DEMO/metrics/timeseries': new Error('boom') });

    expect(await screen.findByText('Espera promedio')).toBeInTheDocument();
  });

  it('keeps the KPIs when the reviews fail', async () => {
    open({ 'GET /restaurants/DEMO/reviews': new Error('boom') });

    expect(await screen.findByText('Espera promedio')).toBeInTheDocument();
  });

  describe('with no activity yet', () => {
    const quiet = {
      'GET /restaurants/DEMO/metrics': {
        metrics: metrics({
          resolvedCount: 0,
          peopleJoined: 0,
          seatedCount: 0,
          averageWaitMinutes: null,
          averageRating: null,
          reviewCount: 0,
        }),
      },
    };

    it('explains the emptiness rather than drawing a chart of nothing', async () => {
      open(quiet);

      expect(await screen.findByText('Todavía no hay actividad')).toBeInTheDocument();
    });

    it('still shows the KPI row, so the panel is not bare', async () => {
      open(quiet);

      expect(await screen.findByText('Espera promedio')).toBeInTheDocument();
    });
  });

  it('draws the volume chart once there is activity', async () => {
    open();

    // By role: the title also appears as the caption of the chart's table
    // view, so a bare text match would be ambiguous.
    expect(
      await screen.findByRole('figure', { name: 'Volumen de fila por hora' }),
    ).toBeInTheDocument();
  });

  it('shows recent reviews when there are any', async () => {
    open({ 'GET /restaurants/DEMO/reviews': REVIEWS });

    // A regex, because the card wraps the comment in typographic quotes.
    expect(await screen.findByText(/Excelente servicio/)).toBeInTheDocument();
  });
});
