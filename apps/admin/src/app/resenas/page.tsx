'use client';

import { isApiRequestError } from '@nexa/api-client';
import { useApi, useSession } from '@nexa/api-client/react';
import type { RestaurantReview, ReviewSummaryResponse } from '@nexa/types';
import { Button, Card, EmptyState, ReviewCard, StatCard, TopBar } from '@nexa/ui';
import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '../../components/admin-shell';
import { relativeTime } from '../../lib/chart-view';
import {
  averageLabel,
  distributionBars,
  percentLabel,
  reviewCountLabel,
  satisfactionRate,
} from '../../lib/reviews-view';

const PAGE_SIZE = 20;

export default function ReviewsPage() {
  return (
    <AdminShell>
      <Reviews />
    </AdminShell>
  );
}

function message(cause: unknown, fallback: string): string {
  return isApiRequestError(cause) ? cause.message : fallback;
}

function Reviews() {
  const api = useApi();
  const { restaurant } = useSession();
  const code = restaurant?.code;

  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null);
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The summary describes every review, so it does not move with the filter.
  useEffect(() => {
    if (!code) return;
    api.restaurants
      .reviewSummary(code)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [api, code]);

  const load = useCallback(
    (filter: number | null) => {
      if (!code) return;
      setLoaded(false);
      setError(null);
      api.restaurants
        .reviews(code, { limit: PAGE_SIZE, ...(filter ? { rating: filter } : {}) })
        .then((data) => {
          setReviews(data.reviews);
          setCursor(data.nextCursor);
          setLoaded(true);
        })
        .catch((cause: unknown) => {
          setError(message(cause, 'No se pudieron cargar las reseñas.'));
          setLoaded(true);
        });
    },
    [api, code],
  );

  useEffect(() => {
    load(rating);
  }, [load, rating]);

  async function loadMore() {
    if (!code || !cursor) return;
    setLoadingMore(true);
    try {
      const data = await api.restaurants.reviews(code, {
        limit: PAGE_SIZE,
        cursor,
        ...(rating ? { rating } : {}),
      });
      // Appended, not replaced: paging must not lose what is already read.
      setReviews((current) => [...current, ...data.reviews]);
      setCursor(data.nextCursor);
    } catch (cause) {
      setError(message(cause, 'No se pudieron cargar más reseñas.'));
    } finally {
      setLoadingMore(false);
    }
  }

  const total = summary?.total ?? 0;
  const happy = summary ? satisfactionRate(summary.distribution, summary.total) : null;

  return (
    <>
      <TopBar title="Reseñas" subtitle="Lo que dicen tus comensales después de visitarte." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Calificación promedio" value={averageLabel(summary?.average ?? null)} />
        <StatCard label="Reseñas recibidas" value={String(total)} />
        {/* The threshold goes in the label, not in `hint`: StatCard shows the
            hint *instead of* the value, for when a number would mislead. */}
        <StatCard label="Satisfechos (4 ★ o más)" value={percentLabel(happy)} />
      </div>

      {summary && summary.total > 0 && (
        <Card className="mt-4 flex flex-col gap-2">
          <h2 className="font-display text-base font-semibold text-foreground">Cómo se reparten</h2>
          {distributionBars(summary.distribution, summary.total).map((bar) => (
            <div key={bar.rating} className="flex items-center gap-3">
              <span className="w-10 shrink-0 font-body text-sm text-muted">{bar.rating} ★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${bar.share * 100}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right font-body text-sm text-muted">
                {reviewCountLabel(bar.count)}
              </span>
            </div>
          ))}
        </Card>
      )}

      <div className="mt-6 mb-3 flex flex-wrap gap-2">
        <FilterChip label="Todas" selected={rating === null} onClick={() => setRating(null)} />
        {[5, 4, 3, 2, 1].map((value) => (
          <FilterChip
            key={value}
            label={`${value} ★`}
            selected={rating === value}
            onClick={() => setRating(value)}
          />
        ))}
      </div>

      {error && <p className="mb-3 font-body text-sm text-error">{error}</p>}

      {!loaded ? (
        <p className="font-body text-muted">Cargando reseñas…</p>
      ) : reviews.length === 0 ? (
        <EmptyState
          title={rating ? `Ninguna reseña de ${rating} estrellas` : 'Todavía no hay reseñas'}
          description={
            rating
              ? 'Prueba con otra calificación para ver el resto.'
              : 'Cuando tus comensales califiquen su visita, sus comentarios aparecerán aquí.'
          }
        />
      ) : (
        <Card className="flex flex-col gap-5">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              name={review.displayName}
              rating={review.rating}
              feedback={review.feedback}
              timeLabel={relativeTime(review.createdAt)}
            />
          ))}

          {cursor && (
            <Button
              variant="secondary"
              className="self-center"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? 'Cargando…' : 'Ver más reseñas'}
            </Button>
          )}
        </Card>
      )}
    </>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={
        selected
          ? 'rounded-full border border-primary bg-primary px-4 py-2 font-body text-sm font-semibold text-primary-foreground'
          : 'rounded-full border border-border bg-surface px-4 py-2 font-body text-sm font-semibold text-foreground hover:bg-black/5'
      }
    >
      {label}
    </button>
  );
}
