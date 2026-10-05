import type { ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface TopBarProps {
  title: string;
  subtitle?: string;
  /** Right-aligned controls: range pickers, primary actions, avatar. */
  actions?: ReactNode;
  className?: string;
}

/** Page heading with its actions. */
export function TopBar({ title, subtitle, actions, className }: TopBarProps) {
  return (
    <header className={cn('mb-6 flex flex-wrap items-center justify-between gap-4', className)}>
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="font-body text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
