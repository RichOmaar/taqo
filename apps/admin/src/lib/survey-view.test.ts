import { describe, expect, it } from 'vitest';

import {
  definitionProblem,
  newQuestion,
  questionProblem,
  repositioned,
  type QuestionDraft,
} from './survey-view';

function draft(overrides: Partial<QuestionDraft> = {}): QuestionDraft {
  return {
    key: 'k1',
    type: 'short_text',
    label: 'Tu nombre',
    helpText: null,
    required: false,
    position: 0,
    config: {},
    ...overrides,
  };
}

describe('newQuestion', () => {
  it('gives a choice question two options to start from', () => {
    // A choice with no options cannot be answered or previewed.
    expect(newQuestion('single_choice', 0).config.options).toHaveLength(2);
  });

  it('gives a rating a default scale', () => {
    expect(newQuestion('rating', 0).config.maxRating).toBe(5);
  });

  it('starts with an empty label, since only the owner knows the question', () => {
    expect(newQuestion('short_text', 0).label).toBe('');
  });

  it('assigns a unique key per question', () => {
    const keys = [newQuestion('short_text', 0).key, newQuestion('short_text', 1).key];

    expect(new Set(keys).size).toBe(2);
  });

  it('takes the position it is given', () => {
    expect(newQuestion('short_text', 3).position).toBe(3);
  });
});

describe('questionProblem', () => {
  it('accepts a well-formed question', () => {
    expect(questionProblem(draft())).toBeNull();
  });

  it('rejects a question with no text', () => {
    expect(questionProblem(draft({ label: '  ' }))).toContain('texto');
  });

  it('rejects a choice with one option', () => {
    const single = draft({ type: 'single_choice', config: { options: ['Sí'] } });

    expect(questionProblem(single)).toContain('al menos 2');
  });

  it('rejects a blank option', () => {
    const blank = draft({ type: 'multi_choice', config: { options: ['Sí', ' '] } });

    expect(questionProblem(blank)).toContain('vacías');
  });

  it('rejects a repeated option', () => {
    const repeated = draft({ type: 'single_choice', config: { options: ['Sí', 'Sí'] } });

    expect(questionProblem(repeated)).toContain('repetida');
  });

  it('rejects a number range that cannot be satisfied', () => {
    const impossible = draft({ type: 'number', config: { min: 10, max: 2 } });

    expect(questionProblem(impossible)).toContain('menor');
  });

  it('leaves an open-ended number range alone', () => {
    expect(questionProblem(draft({ type: 'number', config: { min: 1 } }))).toBeNull();
  });
});

describe('definitionProblem', () => {
  it('is null when every question is fine', () => {
    expect(definitionProblem([draft(), draft({ key: 'k2', position: 1 })])).toBeNull();
  });

  it('surfaces a problem from any question, not just the first', () => {
    const questions = [draft(), draft({ key: 'k2', position: 1, label: '' })];

    expect(definitionProblem(questions)).toContain('texto');
  });

  it('is null for an empty form, which simply cannot be published', () => {
    expect(definitionProblem([])).toBeNull();
  });
});

describe('repositioned', () => {
  it('renumbers to match the order shown', () => {
    const moved = [draft({ key: 'b', position: 1 }), draft({ key: 'a', position: 0 })];

    expect(repositioned(moved).map((q) => [q.key, q.position])).toEqual([
      ['b', 0],
      ['a', 1],
    ]);
  });
});
