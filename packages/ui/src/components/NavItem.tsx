import type { ElementType, ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface NavItemProps {
  label: string;
  /** Supplied by the app, so this package stays icon-library agnostic. */
  icon?: ReactNode;
  active?: boolean;
  /**
   * Element to render as. Defaults to an anchor; apps pass their router's link
   * component (e.g. next/link) to avoid full page reloads.
   */
  as?: ElementType;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/** A single sidebar entry: icon, label and an active state. */
export function NavItem({
  label,
  icon,
  active = false,
  as: Component = 'a',
  className,
  ...rest
}: NavItemProps) {
  return (
    <Component
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex shrink-0 items-center gap-3 rounded-xl px-4 py-3',
        'font-body text-sm font-semibold transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
        active
          ? 'bg-primary text-primary-foreground shadow-soft'
          : 'text-foreground hover:bg-black/5',
        className,
      )}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center">
          {icon}
        </span>
      )}
      <span>{label}</span>
    </Component>
  );
}
