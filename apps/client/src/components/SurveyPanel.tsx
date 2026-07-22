'use client';

import type { SurveyPurpose } from '@nexa/types';
import { Button, Card, SurveyForm } from '@nexa/ui';
import { useState } from 'react';

import { api } from '../lib/nexa';
import { missingRequired, toAnswers, type Answers } from '../lib/survey-answers';
import { useActiveSurvey } from '../lib/use-active-survey';

export interface SurveyPanelProps {
  code: string;
  purpose: SurveyPurpose;
  /** What the response is about: the waitlist entry id. */
  subjectRef: string | null;
  /** Rendered when the restaurant has published no survey for this purpose. */
  fallback?: React.ReactNode;
  onSubmitted?: () => void;
}

/**
 * The diner's side of a configurable survey.
 *
 * The definition is whatever the owner published, so this component knows only
 * how to fetch it, render it and post the answers back — every question type
 * lives in SurveyForm and every rule lives in the API.
 */
export function SurveyPanel({
  code,
  purpose,
  subjectRef,
  fallback = null,
  onSubmitted,
}: SurveyPanelProps) {
  const { survey, loading } = useActiveSurvey(code, purpose);
  const [answers, setAnswers] = useState<Answers>({});
  const [problems, setProblems] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!survey) return;

    const missing = missingRequired(survey.questions, answers);
    setProblems(missing);
    if (Object.keys(missing).length > 0) return;

    setBusy(true);
    setError(null);
    try {
      await api.surveys.submit(survey.id, subjectRef, toAnswers(survey.questions, answers));
      setDone(true);
      onSubmitted?.();
    } catch {
      setError('No pudimos enviar tus respuestas. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;
  if (!survey || survey.questions.length === 0) return <>{fallback}</>;

  if (done) {
    return <p className="font-body text-sm text-secondary-dark">¡Gracias por tu opinión! 💚</p>;
  }

  return (
    <Card className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-display text-lg font-semibold text-foreground">{survey.title}</p>
        {survey.description && <p className="font-body text-sm text-muted">{survey.description}</p>}
      </div>

      <SurveyForm
        questions={survey.questions}
        answers={answers}
        problems={problems}
        disabled={busy}
        onChange={(questionId, value) => {
          setAnswers((current) => ({ ...current, [questionId]: value }));
          // Clear the complaint as soon as it stops being true.
          setProblems((current) => {
            if (!current[questionId]) return current;
            const next = { ...current };
            delete next[questionId];
            return next;
          });
        }}
      />

      {error && <p className="font-body text-sm text-error">{error}</p>}

      <Button onClick={() => void submit()} disabled={busy}>
        {busy ? 'Enviando…' : 'Enviar'}
      </Button>
    </Card>
  );
}
