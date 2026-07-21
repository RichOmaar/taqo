import type { ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** A way forward, e.g. "Agregar fila". */
  action?: ReactNode;
  className?: string;
}

/** Placeholder for a list or panel with nothing to show yet. */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl',
        'border-2 border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="text-3xl text-muted">
          {icon}
        </span>
      )}
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm font-body text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
