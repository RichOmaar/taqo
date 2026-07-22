import { useId } from 'react';

import { cn } from '../utils/cn';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** Rendered next to the label, e.g. "10 min". */
  valueLabel?: string;
  /** Explains what the value affects. */
  description?: string;
  disabled?: boolean;
  className?: string;
}

/** Range input for a bounded numeric setting, such as no-show tolerance. */
export function Slider({
  value,
  onChange,
  label,
  min = 0,
  max = 100,
  step = 1,
  valueLabel,
  description,
  disabled = false,
  className,
}: SliderProps) {
  const id = useId();
  const descriptionId = useId();

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="font-body text-sm font-semibold text-foreground">
          {label}
        </label>
        {valueLabel && (
          <span className="rounded-full bg-primary/10 px-3 py-1 font-body text-xs font-semibold text-primary-dark">
            {valueLabel}
          </span>
        )}
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          'h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      />

      {description && (
        <p id={descriptionId} className="font-body text-xs text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
