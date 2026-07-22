'use client';

import { useSession } from '@nexa/api-client/react';
import { Button, Card, TopBar } from '@nexa/ui';
import { useEffect, useState } from 'react';

import { AdminShell } from '../../components/admin-shell';
import { PLANS, actionLabel, isCurrent, periodLabel, type PlanCard } from '../../lib/plan-view';

export default function PlanPage() {
  return (
    <AdminShell>
      <Plan />
    </AdminShell>
  );
}

function Plan() {
  const { restaurant } = useSession();

  return (
    <>
      <TopBar
        title="Tu plan"
        subtitle="Administra tu suscripción y visualiza tu consumo mensual."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {PLANS.map((card) => (
          <PlanTile key={card.plan} card={card} current={isCurrent(card, restaurant?.plan)} />
        ))}
      </div>

      <UsagePanel timezone={restaurant?.timezone} />
    </>
  );
}

function PlanTile({ card, current }: { card: PlanCard; current: boolean }) {
  return (
    <Card
      className={
        card.recommended
          ? 'relative flex flex-col gap-4 border-2 border-primary'
          : 'relative flex flex-col gap-4'
      }
    >
      {card.recommended && (
        <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 font-body text-xs font-bold tracking-wide text-primary-foreground uppercase">
          Recomendado
        </span>
      )}

      {current && (
        <span className="self-start rounded-full bg-primary/15 px-3 py-1 font-body text-xs font-bold tracking-wide text-primary-dark uppercase">
          Plan actual
        </span>
      )}

      <div className="flex flex-col gap-1">
        <h2 className="font-display text-3xl font-bold text-foreground">{card.name}</h2>
        <p className="font-body text-sm text-muted">{card.tagline}</p>
      </div>

      <p className="flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold text-foreground">{card.price}</span>
        <span className="font-body text-sm text-muted">{card.period}</span>
      </p>

      <ul className="flex flex-col gap-2">
        {card.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 font-body text-sm text-foreground">
            <span aria-hidden="true" className="text-secondary-dark">
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {/*
        Read-only on purpose. There is no payment provider, and `plan` is not
        in the config schema, so no endpoint can change it. A button that
        looked like it would charge and then did nothing is worse than one
        that says where to go.
      */}
      <Button
        variant={card.recommended && !current ? 'primary' : 'secondary'}
        disabled
        className="mt-auto w-full"
      >
        {actionLabel(card, current ? card.plan : undefined)}
      </Button>

      {!current && (
        <p className="text-center font-body text-xs text-muted">
          Escríbenos para cambiar de plan; todavía no se puede desde aquí.
        </p>
      )}
    </Card>
  );
}

/**
 * The mock shows meters for notifications sent and registered diners.
 *
 * Nothing writes the `Notification` table yet, so a "0 enviadas" meter would
 * read as "you sent none" when the truth is that we do not record them. Said
 * plainly instead.
 */
function UsagePanel({ timezone }: { timezone?: string }) {
  // Resolved after mount: the period depends on today's date, and rendering it
  // on the server would hydrate to a different string around midnight.
  const [period, setPeriod] = useState<string | null>(null);
  useEffect(() => {
    setPeriod(periodLabel(new Date(), timezone));
  }, [timezone]);

  return (
    <Card className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Uso actual</h2>
        {period && <span className="font-body text-sm text-muted">Periodo: {period}</span>}
      </div>

      <p className="font-body text-sm text-muted">
        Los medidores de consumo todavía no están disponibles: el envío de notificaciones aún no
        queda registrado, así que cualquier número aquí sería inventado.
      </p>
    </Card>
  );
}
