import type { HTMLAttributes, ReactNode } from 'react';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';

import { cn } from '../utils/cn';
import { Badge } from './Badge';

export type RoadmapStatus = 'completed' | 'in-progress' | 'upcoming';

export interface RoadmapCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Phase label (e.g., "Fase 1"). */
  phase: string;
  /** Phase title. */
  title: string;
  /** Phase description. */
  description: string;
  /** Current status of this phase. */
  status: RoadmapStatus;
  /** Icon element for the phase. */
  icon: ReactNode;
}

const statusConfig: Record<
  RoadmapStatus,
  { label: string; icon: ReactNode; badgeClass: string }
> = {
  completed: {
    label: 'Completado',
    icon: <CheckCircle className="h-4 w-4" />,
    badgeClass: 'text-secondary',
  },
  'in-progress': {
    label: 'En curso',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    badgeClass: 'text-primary',
  },
  upcoming: {
    label: 'Proximamente',
    icon: <Clock className="h-4 w-4" />,
    badgeClass: 'text-muted',
  },
};

/** Roadmap phase card showing status and description. */
export function RoadmapCard({
  phase,
  title,
  description,
  status,
  icon,
  className,
  ...props
}: RoadmapCardProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border p-6',
        status === 'completed' ? 'border-secondary/30 bg-surface' : 'border-border bg-surface',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            status === 'completed' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary',
          )}
        >
          {icon}
        </div>
        <Badge variant="default" className="border-0 bg-transparent px-2">
          {phase}
        </Badge>
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="font-body text-sm leading-relaxed text-muted">{description}</p>
      <div className={cn('flex items-center gap-2 font-body text-sm', config.badgeClass)}>
        {config.icon}
        <span>{config.label}</span>
      </div>
    </div>
  );
}
