'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

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
  /** Whether to use sticky positioning. */
  sticky?: boolean;
  /** Scroll threshold in pixels to trigger pill transformation. */
  scrollThreshold?: number;
}

/** Header that transforms from full-width to floating pill on scroll. */
export function Header({
  logo,
  links,
  cta,
  sticky = true,
  scrollThreshold = 50,
  className,
  ...props
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > scrollThreshold);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold]);

  return (
    <div
      className={cn(
        'z-50 w-full transition-all duration-500 ease-out',
        sticky && 'sticky top-0',
        isScrolled ? 'px-4 pt-3' : 'px-0 pt-0',
      )}
    >
      <header
        className={cn(
          'mx-auto flex items-center justify-between transition-all duration-500 ease-out',
          isScrolled
            ? [
                'max-w-4xl rounded-full px-6 py-3',
                'bg-white/70 backdrop-blur-2xl backdrop-saturate-150',
                'border border-white/30',
                'shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
              ].join(' ')
            : 'max-w-none rounded-none px-6 py-4 lg:px-12 bg-transparent',
          className,
        )}
        {...props}
      >
        <a
          href="/"
          className={cn(
            'font-display font-bold text-primary transition-all duration-300 hover:opacity-80',
            isScrolled ? 'text-lg' : 'text-xl',
          )}
        >
          {logo}
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'relative font-body text-sm transition-all duration-300 hover:text-primary',
                !isScrolled && 'after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full',
                link.active ? 'text-primary font-medium' : 'text-foreground',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        {cta && <div className="hidden md:block">{cta}</div>}

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary/10 hover:text-primary md:hidden"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile menu dropdown */}
      <div
        className={cn(
          'mx-auto overflow-hidden transition-all duration-300 ease-out md:hidden',
          isScrolled ? 'max-w-4xl px-0' : 'max-w-none px-0',
          mobileMenuOpen ? 'mt-2 max-h-96 opacity-100' : 'mt-0 max-h-0 opacity-0',
        )}
      >
        <div
          className={cn(
            'px-6 py-4 backdrop-blur-2xl backdrop-saturate-150 border border-white/30',
            isScrolled
              ? 'rounded-2xl bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.12)] mx-4'
              : 'rounded-none bg-white/90 shadow-lg mx-0',
          )}
        >
          <nav className="flex flex-col gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2 font-body text-base transition-colors hover:bg-primary/10 hover:text-primary',
                  link.active ? 'text-primary bg-primary/5' : 'text-foreground',
                )}
              >
                {link.label}
              </a>
            ))}
            {cta && <div className="mt-2 pt-3 border-t border-border/50">{cta}</div>}
          </nav>
        </div>
      </div>
    </div>
  );
}
