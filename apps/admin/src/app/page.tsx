'use client';

import { isApiRequestError } from '@nexa/api-client';
import { useApi, useSession } from '@nexa/api-client/react';
import type { RestaurantMetrics } from '@nexa/types';
import { Card } from '@nexa/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { RequireSession } from '../components/require-session';
import { formatPercent, formatRating, formatWaitMinutes } from '../lib/format';

export default function DashboardPage() {
  return (
    <RequireSession>
      <Dashboard />
    </RequireSession>
  );
}

function Dashboard() {
  const router = useRouter();
  const api = useApi();
  const { restaurant, signOut } = useSession();
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

  function logout() {
    signOut();
    router.replace('/login');
  }

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
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Buenas tardes</h1>
          <p className="font-body text-sm text-muted">{restaurant?.name} · resumen de hoy</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/configuracion" className="font-body text-sm font-semibold text-primary-dark">
            Configuración →
          </Link>
          <button type="button" onClick={logout} className="font-body text-sm text-muted">
            Salir
          </button>
        </div>
      </header>

      {error && <p className="font-body text-sm text-error">{error}</p>}

      {!error && !metrics && <p className="font-body text-muted">Cargando métricas…</p>}

      {metrics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="flex flex-col gap-1">
              <span className="font-body text-sm text-muted">{stat.label}</span>
              <span className="font-display text-3xl font-bold text-primary-dark">
                {stat.value}
              </span>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
