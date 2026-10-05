import type { ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface SidebarProps {
  /** Brand line, typically the restaurant name. */
  title: string;
  subtitle?: string;
  /** Nav entries, usually `NavItem`s. */
  children: ReactNode;
  /** Pinned to the bottom on desktop: help, sign out. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Restaurant-scoped navigation rail.
 *
 * One element rather than two: a vertical rail from `md` up, and a horizontally
 * scrollable strip below it, so the nav is still reachable on a tablet held in
 * portrait without shipping a second markup tree.
 */
export function Sidebar({ title, subtitle, children, footer, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-surface p-4',
        'md:h-screen md:w-64 md:flex-col md:overflow-x-visible md:overflow-y-auto',
        'md:border-b-0 md:border-r',
        className,
      )}
    >
      <div className="hidden md:block md:px-2 md:pb-6 md:pt-2">
        <p className="font-display text-lg font-bold text-primary-dark">{title}</p>
        {subtitle && <p className="font-body text-sm text-muted">{subtitle}</p>}
      </div>

      <nav aria-label="Principal" className="flex gap-2 md:flex-1 md:flex-col">
        {children}
      </nav>

      {footer && (
        <div className="flex gap-2 md:mt-4 md:flex-col md:border-t md:border-border md:pt-4">
          {footer}
        </div>
      )}
    </aside>
  );
}
