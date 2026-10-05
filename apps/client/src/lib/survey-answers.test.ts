import type { QuestionType, SurveyQuestion } from '@nexa/types';
import { describe, expect, it } from 'vitest';

import { isAnswered, missingRequired, toAnswers } from './survey-answers';

function question(
  id: string,
  type: QuestionType,
  overrides: Partial<SurveyQuestion> = {},
): SurveyQuestion {
  return {
    id,
    type,
    label: `Pregunta ${id}`,
    helpText: null,
    required: false,
    position: 0,
    config: {},
    ...overrides,
  };
}

describe('isAnswered', () => {
  it('counts zero as an answer', () => {
    // An NPS of 0 is the most important answer a restaurant can receive.
    expect(isAnswered(0)).toBe(true);
  });

  it('counts false as an answer', () => {
    expect(isAnswered(false)).toBe(true);
  });

  it('does not count an untouched question', () => {
    expect(isAnswered(undefined)).toBe(false);
  });

  it('does not count an empty string', () => {
    expect(isAnswered('')).toBe(false);
  });

  it('does not count whitespace as a comment', () => {
    expect(isAnswered('   ')).toBe(false);
  });

  it('does not count an empty multi-choice selection', () => {
    expect(isAnswered([])).toBe(false);
  });

  it('counts a single selection', () => {
    expect(isAnswered(['Terraza'])).toBe(true);
  });

  it('does not count NaN, which a blank number input produces', () => {
    expect(isAnswered(Number.NaN)).toBe(false);
  });
});

describe('missingRequired', () => {
  it('is empty when every required question is answered', () => {
    const questions = [question('q1', 'rating', { required: true })];

    expect(missingRequired(questions, { q1: 4 })).toEqual({});
  });

  it('flags an unanswered required question', () => {
    const questions = [question('q1', 'rating', { required: true })];

    expect(missingRequired(questions, {})).toEqual({ q1: 'Esta pregunta es obligatoria.' });
  });

  it('ignores an unanswered optional question', () => {
    const questions = [question('q1', 'long_text')];

    expect(missingRequired(questions, {})).toEqual({});
  });

  it('does not flag a required question answered with zero', () => {
    const questions = [question('q1', 'nps', { required: true })];

    expect(missingRequired(questions, { q1: 0 })).toEqual({});
  });

  it('does not flag a required question answered with no', () => {
    const questions = [question('q1', 'boolean', { required: true })];

    expect(missingRequired(questions, { q1: false })).toEqual({});
  });

  it('flags every offender, not just the first', () => {
    const questions = [
      question('q1', 'rating', { required: true }),
      question('q2', 'short_text', { required: true }),
    ];

    expect(Object.keys(missingRequired(questions, {}))).toEqual(['q1', 'q2']);
  });
});

describe('toAnswers', () => {
  it('sends what was answered', () => {
    const questions = [question('q1', 'rating')];

    expect(toAnswers(questions, { q1: 5 })).toEqual([{ questionId: 'q1', value: 5 }]);
  });

  it('omits an unanswered optional question rather than sending an empty value', () => {
    // The server validates per type; "" is not a valid rating and would 400.
    const questions = [question('q1', 'rating'), question('q2', 'long_text')];

    expect(toAnswers(questions, { q1: 5 })).toEqual([{ questionId: 'q1', value: 5 }]);
  });

  it('trims a comment', () => {
    const questions = [question('q1', 'long_text')];

    expect(toAnswers(questions, { q1: '  todo bien  ' })).toEqual([
      { questionId: 'q1', value: 'todo bien' },
    ]);
  });

  it('keeps a zero answer', () => {
    const questions = [question('q1', 'nps')];

    expect(toAnswers(questions, { q1: 0 })).toEqual([{ questionId: 'q1', value: 0 }]);
  });

  it('keeps a false answer', () => {
    const questions = [question('q1', 'boolean')];

    expect(toAnswers(questions, { q1: false })).toEqual([{ questionId: 'q1', value: false }]);
  });

  it('ignores an answer to a question that is not in the definition', () => {
    // A stale draft in local state must not be smuggled into the payload.
    const questions = [question('q1', 'rating')];

    expect(toAnswers(questions, { q1: 5, ghost: 'x' })).toEqual([{ questionId: 'q1', value: 5 }]);
  });

  it('sends nothing for an untouched optional survey', () => {
    expect(toAnswers([question('q1', 'long_text')], {})).toEqual([]);
  });
});
