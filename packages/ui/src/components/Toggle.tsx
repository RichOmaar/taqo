import { useId } from 'react';

import { cn } from '../utils/cn';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Explains the consequence of turning it on. */
  description?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * On/off switch.
 *
 * A real checkbox under a styled track, so it keeps keyboard behaviour and is
 * announced correctly rather than being a div that looks like a switch.
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: ToggleProps) {
  const descriptionId = useId();

  return (
    <label
      className={cn(
        'flex items-center justify-between gap-4',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className="flex flex-col">
        <span className="font-body text-sm font-semibold text-foreground">{label}</span>
        {description && (
          <span id={descriptionId} className="font-body text-xs text-muted">
            {description}
          </span>
        )}
      </span>

      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-describedby={description ? descriptionId : undefined}
          onChange={(event) => onChange(event.target.checked)}
          className="peer h-6 w-11 cursor-pointer appearance-none rounded-full bg-border transition-colors checked:bg-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-not-allowed"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-surface transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}
