import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface StepCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Step number (1, 2, 3...). */
  step: number;
  /** Icon element displayed in the circular container. */
  icon: ReactNode;
  /** Step title. */
  title: string;
  /** Step description. */
  description: string;
  /** Optional image URL to display below the text. */
  image?: string;
  /** Alt text for the image. */
  imageAlt?: string;
}

/** Step card for "how it works" section with numbered badge. */
export function StepCard({
  step,
  icon,
  title,
  description,
  image,
  imageAlt = '',
  className,
  ...props
}: StepCardProps) {
  return (
    <div
      className={cn(
        'group flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-secondary/50',
        className,
      )}
      {...props}
    >
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-white transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white transition-transform duration-300 group-hover:scale-110">
          {step}
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
      <p className="font-body text-sm leading-relaxed text-muted">{description}</p>
      {image && (
        <div className="mt-2 overflow-hidden rounded-xl">
          <img src={image} alt={imageAlt} className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
      )}
    </div>
  );
}
