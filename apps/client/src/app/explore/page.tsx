'use client';

import type { RestaurantSummary } from '@nexa/types';
import { Button, Card, Input } from '@nexa/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '../../lib/nexa';

export default function CatalogPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [query, setQuery] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.restaurants
      .list()
      .then((data) => setRestaurants(data.restaurants))
      .catch(() => setError('No pudimos cargar el catálogo.'));
  }, []);

  const filtered = restaurants.filter((r) =>
    r.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-5 py-10">
      <h1 className="font-display text-3xl font-bold text-foreground">Explorar restaurantes</h1>

      <Input
        placeholder="Buscar restaurante"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="font-body text-sm text-error">{error}</p>}

      <div className="flex flex-col gap-3">
        {filtered.map((restaurant) => (
          <Card key={restaurant.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                {restaurant.name}
              </p>
              <p className="font-body text-sm text-muted">
                {restaurant.waitingCount === 0
                  ? 'Sin espera'
                  : `${restaurant.waitingCount} en espera`}
              </p>
            </div>
            <Button size="sm" onClick={() => router.push(`/?code=${restaurant.code}`)}>
              Unirme
            </Button>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="font-body text-muted">No encontramos restaurantes.</p>
        )}
      </div>

      <Card className="flex flex-col gap-3">
        <span className="font-body text-sm font-semibold text-foreground">¿Tienes un código?</span>
        <div className="flex gap-2">
          <Input
            placeholder="Ej. DEMO"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <Button size="sm" onClick={() => code.trim() && router.push(`/?code=${code.trim()}`)}>
            Ir
          </Button>
        </div>
      </Card>
    </main>
  );
}
