'use client';

import type { Survey, SurveyPurpose } from '@nexa/types';
import { useEffect, useState } from 'react';

import { api } from './nexa';

/**
 * The published survey for a purpose, or null when the owner has not published
 * one. A survey is a bonus, never a blocker: a failed fetch reads as "no
 * survey" rather than breaking the screen it sits on.
 */
export function useActiveSurvey(
  code: string,
  purpose: SurveyPurpose,
): { survey: Survey | null; loading: boolean } {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);

    api.surveys
      .active(code, purpose)
      .then((data) => {
        if (live) setSurvey(data.survey);
      })
      .catch(() => undefined)
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [code, purpose]);

  return { survey, loading };
}
