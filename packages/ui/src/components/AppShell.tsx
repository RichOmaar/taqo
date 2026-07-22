import type { ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface AppShellProps {
  /** Typically a `Sidebar`. */
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Two-pane application frame: navigation alongside a scrolling content column.
 *
 * The content column scrolls independently on desktop so the nav stays put on a
 * long dashboard.
 */
export function AppShell({ sidebar, children, className }: AppShellProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-background md:flex-row', className)}>
      {sidebar}
      <main className="flex-1 md:h-screen md:overflow-y-auto">
        <div className="mx-auto max-w-[1200px] px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
