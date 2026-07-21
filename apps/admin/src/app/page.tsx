'use client';

import { isApiRequestError } from '@nexa/api-client';
import { useApi, useSession } from '@nexa/api-client/react';
import type { RestaurantMetrics } from '@nexa/types';
import { StatCard, TopBar } from '@nexa/ui';
import { useEffect, useState } from 'react';

import { AdminShell } from '../components/admin-shell';
import { formatPercent, formatRating, formatWaitMinutes } from '../lib/format';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) return;
    api.restaurants
      .metrics(restaurant.code)
      .then((data) => setMetrics(data.metrics))
      .catch((cause: unknown) => {
        setError(isApiRequestError(cause) ? cause.message : 'No se pudieron cargar las métricas.');
      });
  }, [api, restaurant]);

  const stats = metrics
    ? [
        { label: 'Espera promedio', value: formatWaitMinutes(metrics.averageWaitMinutes) },
        { label: 'Personas hoy', value: String(metrics.peopleToday) },
        { label: 'Tasa de no-show', value: formatPercent(metrics.noShowRate) },
        { label: 'Conversión anotado → sentado', value: formatPercent(metrics.seatedConversion) },
        { label: 'Rating promedio', value: formatRating(metrics.averageRating) },
      ]
    : [];

  return (
    <>
      <TopBar title={greeting()} subtitle={`${restaurant?.name ?? ''} · resumen de hoy`} />

      {error && <p className="font-body text-sm text-error">{error}</p>}

      {!error && !metrics && <p className="font-body text-muted">Cargando métricas…</p>}

      {metrics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
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
