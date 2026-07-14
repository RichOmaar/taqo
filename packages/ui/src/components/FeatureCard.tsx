import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface FeatureCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon element to display in the circular container. */
  icon: ReactNode;
  /** Feature title. */
  title: string;
  /** Feature description. */
  description: string;
  /** Whether this card has the highlighted CTA style. */
  highlighted?: boolean;
}

/** Feature card for benefits section with icon, title, and description. */
export function FeatureCard({
  icon,
  title,
  description,
  highlighted = false,
  className,
  ...props
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'group flex flex-col gap-4 rounded-2xl p-6 transition-all duration-300',
        highlighted
          ? 'bg-primary text-primary-foreground hover:bg-primary-dark'
          : 'bg-surface text-foreground hover:-translate-y-1 hover:shadow-lg',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110',
          highlighted ? 'bg-white/20' : 'bg-primary/10',
        )}
      >
        <span className={cn(highlighted ? 'text-white' : 'text-primary')}>{icon}</span>
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p
        className={cn(
          'font-body text-sm leading-relaxed',
          highlighted ? 'text-white/90' : 'text-muted',
        )}
      >
        {description}
      </p>
    </div>
  );
}
