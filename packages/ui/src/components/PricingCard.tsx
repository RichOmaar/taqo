import type { HTMLAttributes, ReactNode } from 'react';
import { Check, Plus } from 'lucide-react';

import { cn } from '../utils/cn';
import { Badge } from './Badge';

export interface PricingFeature {
  text: string;
  /** If true, shows a plus icon instead of check (for "includes everything plus..." features). */
  isAddition?: boolean;
}

export interface PricingCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Plan label (e.g., "PLAN ESENCIAL"). */
  label: string;
  /** Plan name (e.g., "Gratis", "Pro"). */
  name: string;
  /** Price display (e.g., "$0", "Consúltanos"). */
  price: string;
  /** Price suffix (e.g., "/mes"). */
  priceSuffix?: string;
  /** List of features included in this plan. */
  features: PricingFeature[];
  /** Whether this plan is recommended/highlighted. */
  recommended?: boolean;
  /** CTA button element. */
  cta: ReactNode;
  /** Optional note above features (e.g., "Incluye todo lo de Gratis, más:"). */
  featuresNote?: string;
}

/** Pricing plan card with features list and CTA. */
export function PricingCard({
  label,
  name,
  price,
  priceSuffix = '/mes',
  features,
  recommended = false,
  cta,
  featuresNote,
  className,
  ...props
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-6 rounded-2xl p-8 transition-all duration-300',
        recommended
          ? 'border-2 border-primary bg-surface shadow-lg hover:shadow-xl hover:-translate-y-1'
          : 'bg-background hover:bg-surface hover:shadow-soft',
        className,
      )}
      {...props}
    >
      {recommended && (
        <Badge variant="primary" className="absolute -top-3 right-6">
          Recomendado
        </Badge>
      )}
      <div>
        <span className="font-body text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
        <h3 className="mt-1 font-display text-2xl font-bold text-foreground">{name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-display text-3xl font-bold text-primary">{price}</span>
          {priceSuffix && <span className="font-body text-muted">{priceSuffix}</span>}
        </div>
      </div>
      {featuresNote && (
        <p className="font-body text-sm font-medium text-primary">{featuresNote}</p>
      )}
      <ul className="flex flex-col gap-3">
        {features.map((feature) => (
          <li key={feature.text} className="flex items-start gap-3">
            {feature.isAddition ? (
              <Plus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            )}
            <span className="font-body text-sm text-foreground">{feature.text}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto">{cta}</div>
    </div>
  );
}
