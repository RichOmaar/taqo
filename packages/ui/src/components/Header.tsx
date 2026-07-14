import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  /** Logo element or text. */
  logo: ReactNode;
  /** Navigation links. */
  links: NavLink[];
  /** CTA button element. */
  cta?: ReactNode;
}

/** Site header with logo, navigation links, and optional CTA. */
export function Header({ logo, links, cta, className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 py-4 lg:px-12',
        className,
      )}
      {...props}
    >
      <div className="font-display text-xl font-bold text-primary">{logo}</div>
      <nav className="hidden items-center gap-8 md:flex">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={cn(
              'font-body text-sm transition-colors hover:text-primary',
              link.active ? 'text-primary border-b-2 border-primary pb-1' : 'text-foreground',
            )}
          >
            {link.label}
          </a>
        ))}
      </nav>
      {cta && <div className="hidden md:block">{cta}</div>}
    </header>
  );
}
