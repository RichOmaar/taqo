'use client';

import { isApiRequestError } from '@nexa/api-client';
import { useApi, useSession } from '@nexa/api-client/react';
import type {
  GetMetricsSeriesResponse,
  GetPeakHoursResponse,
  RestaurantMetrics,
  RestaurantReview,
} from '@nexa/types';
import { Card, EmptyState, GroupedBarChart, Heatmap, ReviewCard, StatCard, TopBar } from '@nexa/ui';
import { useEffect, useState } from 'react';

import { AdminShell } from '../components/admin-shell';
import {
  HOUR_LABELS,
  WEEKDAY_LABELS,
  hourLabels,
  relativeTime,
  strideFor,
  toHeatmapCells,
} from '../lib/chart-view';
import { hasNoActivity, toMetricViews } from '../lib/metrics-view';

export default function DashboardPage() {
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  );
}

function Dashboard() {
  const api = useApi();
  const { restaurant } = useSession();
  const [metrics, setMetrics] = useState<RestaurantMetrics | null>(null);
  const [previous, setPrevious] = useState<RestaurantMetrics | undefined>();
  const [series, setSeries] = useState<GetMetricsSeriesResponse | null>(null);
  const [peak, setPeak] = useState<GetPeakHoursResponse | null>(null);
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) return;
    const code = restaurant.code;

    // One failure should not blank the whole panel, so the three requests are
    // independent and only the KPI row reports an error.
    api.restaurants
      .metrics(code)
      .then((data) => {
        setMetrics(data.metrics);
        setPrevious(data.previous);
      })
      .catch((cause: unknown) => {
        setError(isApiRequestError(cause) ? cause.message : 'No se pudieron cargar las métricas.');
      });

    api.restaurants
      .metricsSeries(code, { bucket: 'hour' })
      .then(setSeries)
      .catch(() => setSeries(null));

    api.restaurants
      .peakHours(code)
      .then(setPeak)
      .catch(() => setPeak(null));

    api.restaurants
      .reviews(code, { limit: 3 })
      .then((data) => setReviews(data.reviews))
      .catch(() => setReviews([]));
  }, [api, restaurant]);

  return (
    <>
      <TopBar title={greeting()} subtitle={`${restaurant?.name ?? ''} · resumen de hoy`} />

      {error && <p className="font-body text-sm text-error">{error}</p>}

      {!error && !metrics && <p className="font-body text-muted">Cargando métricas…</p>}

      {metrics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toMetricViews(metrics, previous).map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
                delta={stat.delta}
                trend={stat.trend}
                tone={stat.tone}
              />
            ))}
          </div>

          {hasNoActivity(metrics) ? (
            <EmptyState
              className="mt-6"
              title="Todavía no hay actividad"
              description="Cuando tus comensales empiecen a anotarse, aquí verás sus tiempos de espera, la conversión y sus reseñas."
            />
          ) : (
            <div className="mt-6 grid gap-4">
              {series && (
                <Card>
                  <GroupedBarChart
                    title="Volumen de fila por hora"
                    categories={hourLabels(series.points, series.timezone)}
                    series={[
                      {
                        key: 'joined',
                        label: 'Se anotaron',
                        values: series.points.map((point) => point.joined),
                      },
                      {
                        key: 'seated',
                        label: 'Se sentaron',
                        values: series.points.map((point) => point.seated),
                      },
                    ]}
                    labelStride={strideFor(series.points.length)}
                    formatValue={(value) => `${value} ${value === 1 ? 'persona' : 'personas'}`}
                  />
                </Card>
              )}

              {reviews.length > 0 && (
                <Card className="flex flex-col gap-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-display text-base font-semibold text-foreground">
                      Reseñas recientes
                    </h2>
                    <span className="font-body text-xs text-muted">Últimas {reviews.length}</span>
                  </div>
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      name={review.displayName}
                      rating={review.rating}
                      feedback={review.feedback}
                      timeLabel={relativeTime(review.createdAt)}
                    />
                  ))}
                </Card>
              )}

              {peak && (
                <Card>
                  <Heatmap
                    title="Horas pico"
                    rowLabels={WEEKDAY_LABELS}
                    columnLabels={HOUR_LABELS}
                    cells={toHeatmapCells(peak.cells)}
                    highest={peak.busiest}
                    labelStride={3}
                    describeCell={(day, hour, value) =>
                      `${day} ${hour}:00 · ${value} ${value === 1 ? 'persona' : 'personas'}`
                    }
                  />
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

/** Time-of-day greeting, matching the mock's copy. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
