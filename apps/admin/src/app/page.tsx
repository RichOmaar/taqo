'use client';

import type { RestaurantMetrics } from '@nexa/types';
import { Card } from '@nexa/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getMetrics } from '../lib/api';
import { getToken, signOut } from '../lib/auth';

const CODE = 'DEMO';

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<RestaurantMetrics | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    getMetrics(CODE)
      .then((data) => setMetrics(data.metrics))
      .catch(() => undefined);
  }, [router]);

  function logout() {
    signOut();
    router.replace('/login');
  }

  const stats = metrics
    ? [
        {
          label: 'Espera promedio',
          value: metrics.averageWaitMinutes != null ? `${metrics.averageWaitMinutes} min` : '—',
        },
        { label: 'Personas hoy', value: String(metrics.peopleToday) },
        { label: 'Tasa de no-show', value: percent(metrics.noShowRate) },
        { label: 'Conversión anotado → sentado', value: percent(metrics.seatedConversion) },
        {
          label: 'Rating promedio',
          value: metrics.averageRating != null ? `${metrics.averageRating} ⭐` : '—',
        },
      ]
    : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Buenas tardes</h1>
          <p className="font-body text-sm text-muted">Bistro Moderno · resumen de hoy</p>
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

      {metrics ? (
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
      ) : (
        <p className="font-body text-muted">Cargando métricas…</p>
      )}
    </main>
  );
}
