import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  /** Logo element or text. */
  logo: ReactNode;
  /** Tagline below logo. */
  tagline?: string;
  /** Footer columns with links. */
  columns: FooterColumn[];
  /** Social icons to display below the tagline. */
  socialIcons?: ReactNode;
  /** Legal links (privacy, terms). */
  legalLinks?: { label: string; href: string }[];
  /** Copyright text. */
  copyright?: string;
  /** Slogan text on the right of legal section. */
  slogan?: string;
}

/** Site footer with logo, columns, and legal links. */
export function Footer({
  logo,
  tagline,
  columns,
  socialIcons,
  legalLinks,
  copyright,
  slogan,
  className,
  ...props
}: FooterProps) {
  return (
    <footer className={cn('bg-background px-6 py-12 lg:px-12', className)} {...props}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="font-display text-xl font-bold text-foreground">{logo}</div>
            {tagline && (
              <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-muted">
                {tagline}
              </p>
            )}
            {socialIcons && <div className="mt-6 flex gap-4">{socialIcons}</div>}
          </div>

          {/* Link columns */}
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="font-body text-xs font-semibold uppercase tracking-wider text-foreground">
                {column.title}
              </h4>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="font-body text-sm text-muted transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal section */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <div className="flex flex-wrap items-center gap-4">
            {legalLinks?.map((link, i) => (
              <span key={link.href} className="flex items-center gap-4">
                <a
                  href={link.href}
                  className="font-body text-xs text-muted transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
                {i < legalLinks.length - 1 && (
                  <span className="text-muted">·</span>
                )}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 font-body text-xs text-muted">
            {copyright && <span>{copyright}</span>}
            {slogan && (
              <>
                <span className="text-muted">·</span>
                <span className="italic">{slogan}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
