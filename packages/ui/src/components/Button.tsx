import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-dark',
  secondary: 'border-2 border-primary bg-transparent text-primary hover:bg-primary/10',
  ghost: 'bg-transparent text-foreground hover:bg-black/5',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-base',
  lg: 'h-14 px-8 text-lg',
};

/** Pill-shaped primary action button. */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-display font-semibold',
        'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
        'disabled:pointer-events-none disabled:opacity-50',
        'active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
