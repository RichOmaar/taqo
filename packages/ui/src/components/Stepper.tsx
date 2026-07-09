import { cn } from '../utils/cn';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

/** Numeric stepper, e.g. for party size. */
export function Stepper({ value, onChange, min = 1, max = 99, className }: StepperProps) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  const buttonClass =
    'flex h-10 w-10 items-center justify-center rounded-full border border-border text-lg font-semibold text-foreground transition-colors hover:bg-black/5 disabled:opacity-40';

  return (
    <div className={cn('inline-flex items-center gap-4', className)}>
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className={buttonClass}
        aria-label="Menos"
      >
        −
      </button>
      <span className="min-w-8 text-center font-display text-xl font-bold text-foreground">
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className={buttonClass}
        aria-label="Más"
      >
        +
      </button>
    </div>
  );
}
