import { cn } from '../utils/cn';

const steps = ['Esperando', 'Avisado', 'Sentado'] as const;

export interface StatusTimelineProps {
  /** Index of the current step (0-based). */
  activeStep: number;
  className?: string;
}

/** Visual progression: Esperando → Avisado → Sentado. */
export function StatusTimeline({ activeStep, className }: StatusTimelineProps) {
  return (
    <ol className={cn('flex items-center gap-2', className)}>
      {steps.map((label, index) => {
        const reached = index <= activeStep;
        const isLast = index === steps.length - 1;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                reached ? 'bg-primary text-primary-foreground' : 'bg-black/5 text-muted',
              )}
            >
              {index + 1}
            </span>
            <span className={cn('font-body text-sm', reached ? 'text-foreground' : 'text-muted')}>
              {label}
            </span>
            {!isLast && (
              <span
                className={cn(
                  'h-0.5 flex-1 rounded-full',
                  index < activeStep ? 'bg-primary' : 'bg-black/10',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
