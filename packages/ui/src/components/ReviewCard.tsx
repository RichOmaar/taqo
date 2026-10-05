import { cn } from '../utils/cn';

export interface ReviewCardProps {
  name: string;
  /** 1–5. */
  rating: number;
  feedback?: string | null;
  /** Already formatted, e.g. "Hace 10 min". */
  timeLabel?: string;
  className?: string;
}

const MAX_RATING = 5;

/** A single review: who, how many stars, and what they said. */
export function ReviewCard({ name, rating, feedback, timeLabel, className }: ReviewCardProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <article className={cn('flex gap-3', className)}>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary-dark"
      >
        {initial}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="font-body text-sm font-semibold text-foreground">{name}</p>
          {timeLabel && <span className="font-body text-xs text-muted">{timeLabel}</span>}
        </div>

        {/* The stars are decorative; the rating is stated in text for anyone
            who cannot see them, so it is never shape-only. */}
        <p className="font-body text-sm leading-none text-primary">
          <span aria-hidden="true">
            {'★'.repeat(rating)}
            <span className="text-border">{'★'.repeat(MAX_RATING - rating)}</span>
          </span>
          <span className="sr-only">
            {rating} de {MAX_RATING}
          </span>
        </p>

        {feedback && (
          <p className="mt-1 font-body text-sm italic text-muted">
            {'“'}
            {feedback}
            {'”'}
          </p>
        )}
      </div>
    </article>
  );
}
