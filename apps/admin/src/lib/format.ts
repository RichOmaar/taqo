export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatWaitMinutes(minutes: number | null): string {
  return minutes != null ? `${minutes} min` : '—';
}

export function formatRating(rating: number | null): string {
  return rating != null ? `${rating} ⭐` : '—';
}
