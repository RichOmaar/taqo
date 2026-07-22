import type { RestaurantPlan } from '@nexa/types';

export interface PlanCard {
  plan: RestaurantPlan;
  name: string;
  tagline: string;
  price: string;
  period: string;
  features: string[];
  /** Shown above the name, e.g. "Plan actual". */
  recommended?: boolean;
}

/**
 * The two plans, as the mock states them.
 *
 * Hard-coded because there is no billing provider and no plan catalogue in the
 * backend: these are marketing copy, not data. When pricing becomes something
 * the business changes without a deploy, it moves server-side.
 */
export const PLANS: PlanCard[] = [
  {
    plan: 'free',
    name: 'Gratis',
    tagline: 'Ideal para pequeños bistros comenzando su viaje digital.',
    price: '$0',
    period: '/mes',
    features: [
      'Gestión de fila',
      'Colas ilimitadas',
      'Notificaciones web',
      'Métricas básicas',
      'Encuestas y membresías',
    ],
  },
  {
    plan: 'paid',
    name: 'Pro',
    tagline: 'Optimiza la rotación de mesas y deleita a tus clientes con comunicación premium.',
    price: '$499',
    period: '/mes MXN',
    recommended: true,
    features: [
      'Todo lo de Gratis',
      'Notificaciones SMS y WhatsApp',
      'Métricas avanzadas',
      'Soporte prioritario',
    ],
  },
];

export function isCurrent(card: PlanCard, plan: RestaurantPlan | undefined): boolean {
  return card.plan === plan;
}

/** Label for the card's button, which depends on where the restaurant already is. */
export function actionLabel(card: PlanCard, plan: RestaurantPlan | undefined): string {
  if (isCurrent(card, plan)) return 'Tu plan actual';
  return card.plan === 'paid' ? 'Mejorar a Pro' : 'Cambiar a Gratis';
}

/**
 * What the current period covers.
 *
 * Calendar month, because that is what the mock's "Periodo: Octubre 2023"
 * means and what a monthly subscription bills on.
 */
export function periodLabel(now: Date, timeZone = 'America/Mexico_City'): string {
  const label = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(now);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
