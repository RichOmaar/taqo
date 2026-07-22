'use client';

import { useId } from 'react';
import type { AnswerValue, SurveyQuestion } from '@nexa/types';

import { cn } from '../utils/cn';
import { Input } from './Input';

export type SurveyAnswers = Record<string, AnswerValue>;

export interface SurveyFormProps {
  questions: SurveyQuestion[];
  answers: SurveyAnswers;
  onChange: (questionId: string, value: AnswerValue) => void;
  /** Server-reported problems, keyed by question id. */
  problems?: Record<string, string>;
  disabled?: boolean;
  className?: string;
}

const NPS_SCALE = Array.from({ length: 11 }, (_, index) => index);

/**
 * Renders a survey definition as a form.
 *
 * Presentational: it holds no answers of its own and knows nothing about the
 * API. The same component serves the intake form and the post-visit survey,
 * which is the whole point of one engine with two purposes.
 */
export function SurveyForm({
  questions,
  answers,
  onChange,
  problems = {},
  disabled = false,
  className,
}: SurveyFormProps) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {[...questions]
        .sort((a, b) => a.position - b.position)
        .map((question) => (
          <Field
            key={question.id}
            question={question}
            value={answers[question.id]}
            problem={problems[question.id]}
            disabled={disabled}
            onChange={(value) => onChange(question.id, value)}
          />
        ))}
    </div>
  );
}

interface FieldProps {
  question: SurveyQuestion;
  value: AnswerValue | undefined;
  problem?: string;
  disabled: boolean;
  onChange: (value: AnswerValue) => void;
}

function Field({ question, value, problem, disabled, onChange }: FieldProps) {
  const fieldId = useId();
  const helpId = useId();
  const errorId = useId();

  // Choice inputs are labelled by their group, not by a single control, so the
  // wrapper is a fieldset rather than a label.
  const isGroup =
    question.type === 'single_choice' ||
    question.type === 'multi_choice' ||
    question.type === 'rating' ||
    question.type === 'nps' ||
    question.type === 'boolean';

  const describedBy =
    [question.helpText ? helpId : null, problem ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  const heading = (
    <>
      <span className="font-body text-sm font-semibold text-foreground">
        {question.label}
        {question.required && (
          <span className="text-primary" aria-hidden="true">
            {' *'}
          </span>
        )}
        {question.required && <span className="sr-only"> (obligatoria)</span>}
      </span>
      {question.helpText && (
        <span id={helpId} className="font-body text-xs text-muted">
          {question.helpText}
        </span>
      )}
    </>
  );

  const control = (
    <Control
      question={question}
      value={value}
      disabled={disabled}
      fieldId={fieldId}
      describedBy={describedBy}
      onChange={onChange}
    />
  );

  const error = problem && (
    <p id={errorId} className="font-body text-xs text-error">
      {problem}
    </p>
  );

  if (isGroup) {
    return (
      <fieldset className="flex flex-col gap-2 border-0 p-0" aria-describedby={describedBy}>
        <legend className="flex flex-col gap-1 p-0">{heading}</legend>
        {control}
        {error}
      </fieldset>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="flex flex-col gap-1">
        {heading}
      </label>
      {control}
      {error}
    </div>
  );
}

interface ControlProps extends Omit<FieldProps, 'problem'> {
  fieldId: string;
  describedBy: string | undefined;
}

function Control({ question, value, disabled, fieldId, describedBy, onChange }: ControlProps) {
  const { config } = question;

  switch (question.type) {
    case 'long_text':
      return (
        <textarea
          id={fieldId}
          rows={3}
          disabled={disabled}
          aria-describedby={describedBy}
          maxLength={config.maxLength}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 font-body text-base text-foreground focus:border-secondary focus:outline-none disabled:opacity-50"
        />
      );

    case 'number':
      return (
        <Input
          id={fieldId}
          type="number"
          disabled={disabled}
          aria-describedby={describedBy}
          min={config.min}
          max={config.max}
          value={typeof value === 'number' ? value : ''}
          onChange={(event) =>
            onChange(event.target.value === '' ? '' : Number(event.target.value))
          }
        />
      );

    case 'single_choice':
      return (
        <div className="flex flex-wrap gap-2">
          {(config.options ?? []).map((option) => (
            <Chip
              key={option}
              label={option}
              selected={value === option}
              disabled={disabled}
              onClick={() => onChange(option)}
            />
          ))}
        </div>
      );

    case 'multi_choice': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {(config.options ?? []).map((option) => (
            <Chip
              key={option}
              label={option}
              selected={selected.includes(option)}
              disabled={disabled}
              onClick={() =>
                onChange(
                  selected.includes(option)
                    ? selected.filter((item) => item !== option)
                    : [...selected, option],
                )
              }
            />
          ))}
        </div>
      );
    }

    case 'rating': {
      const top = config.maxRating ?? 5;
      const current = typeof value === 'number' ? value : 0;
      return (
        <div className="flex gap-1">
          {Array.from({ length: top }, (_, index) => index + 1).map((star) => (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              aria-pressed={star === current}
              aria-label={`${star} de ${top}`}
              className={cn(
                'text-2xl leading-none transition-transform hover:scale-110 disabled:opacity-50',
                star <= current ? 'text-primary' : 'text-border',
              )}
            >
              ★
            </button>
          ))}
        </div>
      );
    }

    case 'nps':
      return (
        <div className="flex flex-wrap gap-1">
          {NPS_SCALE.map((score) => (
            <Chip
              key={score}
              label={String(score)}
              selected={value === score}
              disabled={disabled}
              onClick={() => onChange(score)}
              compact
            />
          ))}
        </div>
      );

    case 'boolean':
      return (
        <div className="flex gap-2">
          {[
            { label: 'Sí', answer: true },
            { label: 'No', answer: false },
          ].map((option) => (
            <Chip
              key={option.label}
              label={option.label}
              selected={value === option.answer}
              disabled={disabled}
              onClick={() => onChange(option.answer)}
            />
          ))}
        </div>
      );

    case 'date':
      return (
        <Input
          id={fieldId}
          type="date"
          disabled={disabled}
          aria-describedby={describedBy}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    default:
      return (
        <Input
          id={fieldId}
          type={question.type === 'email' ? 'email' : question.type === 'phone' ? 'tel' : 'text'}
          disabled={disabled}
          aria-describedby={describedBy}
          maxLength={config.maxLength}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}

function Chip({
  label,
  selected,
  disabled,
  onClick,
  compact = false,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      // aria-pressed rather than a checkbox role: these behave as toggles and
      // the state has to be announced, not inferred from colour.
      aria-pressed={selected}
      className={cn(
        'rounded-full border font-body text-sm font-semibold transition-colors disabled:opacity-50',
        compact ? 'h-9 w-9' : 'px-4 py-2',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-surface text-foreground hover:bg-black/5',
      )}
    >
      {label}
    </button>
  );
}
