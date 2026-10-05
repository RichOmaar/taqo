import type {
  AccrualMode,
  DowngradePolicy,
  MembershipProgram,
  ProgramStatus,
  TierMetric,
  TierPeriod,
} from '@nexa/types';
import type { ProgramSettings, TierInput } from '@nexa/api-client';

/** Spanish labels for the programme's configuration options. */
export const ACCRUAL_LABELS: Record<AccrualMode, string> = {
  visits: 'Solo visitas',
  points: 'Solo puntos',
  both: 'Visitas y puntos',
};

export const TIER_METRIC_LABELS: Record<TierMetric, string> = {
  visits: 'Visitas acumuladas',
  points: 'Puntos acumulados',
};

export const TIER_PERIOD_LABELS: Record<TierPeriod, string> = {
  lifetime: 'De por vida',
  rolling: 'Ventana móvil',
};

export const DOWNGRADE_LABELS: Record<DowngradePolicy, string> = {
  never: 'Nunca baja de nivel',
  on_period_exit: 'Baja al salir de la ventana',
};

export const STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado',
};

/** Sensible starting point, so an owner is not asked to design from nothing. */
export const DEFAULT_SETTINGS: ProgramSettings = {
  name: 'Club de clientes',
  accrualMode: 'both',
  pointsPerVisit: 10,
  tierMetric: 'visits',
  tierPeriod: 'lifetime',
  tierWindowDays: null,
  downgradePolicy: 'never',
};

export const STARTER_TIERS: TierInput[] = [
  { name: 'Bronce', threshold: 0, benefits: ['Acumula visitas'], position: 0 },
  { name: 'Plata', threshold: 5, benefits: ['Postre de cortesía'], position: 1 },
  { name: 'Oro', threshold: 15, benefits: ['Acceso a cola VIP'], position: 2 },
];

export function settingsOf(program: MembershipProgram): ProgramSettings {
  return {
    name: program.name,
    accrualMode: program.accrualMode,
    pointsPerVisit: program.pointsPerVisit,
    tierMetric: program.tierMetric,
    tierPeriod: program.tierPeriod,
    tierWindowDays: program.tierWindowDays,
    downgradePolicy: program.downgradePolicy,
  };
}

/**
 * The same rule the server enforces, checked while the owner types.
 *
 * Duplicated deliberately: the server is the authority and must reject a bad
 * scheme however it arrives, but discovering the problem after pressing save
 * is a worse way to learn it.
 */
export function tierSchemeProblem(tiers: TierInput[]): string | null {
  const ordered = [...tiers].sort((a, b) => a.position - b.position);

  for (const [index, tier] of ordered.entries()) {
    if (!tier.name.trim()) return 'Cada nivel necesita un nombre.';

    const previous = ordered[index - 1];
    if (previous && tier.threshold <= previous.threshold) {
      return `"${tier.name}" debe pedir más que "${previous.name}" para ser un escalón.`;
    }
  }

  return null;
}

/** Renumbers positions after a row is added or removed. */
export function repositioned(tiers: TierInput[]): TierInput[] {
  return tiers.map((tier, index) => ({ ...tier, position: index }));
}

/** What the tier metric is counted in, for labelling a threshold field. */
export function metricUnit(metric: TierMetric): string {
  return metric === 'points' ? 'puntos' : 'visitas';
}
