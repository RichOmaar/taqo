import type { InputHTMLAttributes } from 'react';

import { cn } from '../utils/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Soft-rounded text input with a teal focus ring. */
export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'w-full rounded-lg border border-border bg-surface px-4 py-3 font-body text-foreground',
        'placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40',
        className,
      )}
      {...props}
    />
  );
}
