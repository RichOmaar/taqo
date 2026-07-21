'use client';

import { isApiRequestError } from '@nexa/api-client';
import { useApi, useSession } from '@nexa/api-client/react';
import type { RestaurantMetrics } from '@nexa/types';
import { EmptyState, StatCard, TopBar } from '@nexa/ui';
import { useEffect, useState } from 'react';

import { AdminShell } from '../components/admin-shell';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) return;
    api.restaurants
      .metrics(restaurant.code)
      .then((data) => {
        setMetrics(data.metrics);
        setPrevious(data.previous);
      })
      .catch((cause: unknown) => {
        setError(isApiRequestError(cause) ? cause.message : 'No se pudieron cargar las métricas.');
      });
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

          {hasNoActivity(metrics) && (
            <EmptyState
              className="mt-6"
              title="Todavía no hay actividad"
              description="Cuando tus comensales empiecen a anotarse, aquí verás sus tiempos de espera, la conversión y sus reseñas."
            />
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
