import type { QuestionType, SurveyQuestion } from '@nexa/types';
import { describe, expect, it } from 'vitest';

import {
  changesMeaning,
  repositioned,
  validateDefinition,
  validateQuestionConfig,
} from './definition-rules';

function question(overrides: Partial<SurveyQuestion> = {}): SurveyQuestion {
  return {
    id: 'q1',
    type: 'short_text',
    label: 'Tu nombre',
    helpText: null,
    required: false,
    position: 0,
    config: {},
    ...overrides,
  };
}

describe('validateQuestionConfig', () => {
  it.each<QuestionType>(['single_choice', 'multi_choice'])(
    'rejects %s with a single option',
    (type) => {
      // One option is not a choice, it is a statement.
      expect(validateQuestionConfig(type, { options: ['Sí'] })).toContain('al menos 2');
    },
  );

  it('accepts a choice with two options', () => {
    expect(validateQuestionConfig('single_choice', { options: ['Sí', 'No'] })).toBeNull();
  });

  it('rejects a blank option', () => {
    expect(validateQuestionConfig('single_choice', { options: ['Sí', '  '] })).toContain('vacías');
  });

  it('rejects duplicate options', () => {
    expect(validateQuestionConfig('single_choice', { options: ['Sí', 'Sí'] })).toContain('repitas');
  });

  it('rejects a rating scale of one', () => {
    expect(validateQuestionConfig('rating', { maxRating: 1 })).toContain('escala');
  });

  it('accepts the usual rating scales', () => {
    expect(validateQuestionConfig('rating', { maxRating: 5 })).toBeNull();
    expect(validateQuestionConfig('rating', { maxRating: 10 })).toBeNull();
  });

  it('rejects a number range that cannot be satisfied', () => {
    expect(validateQuestionConfig('number', { min: 10, max: 5 })).toContain('menor');
  });

  it('leaves an open-ended number range alone', () => {
    expect(validateQuestionConfig('number', { min: 1 })).toBeNull();
  });
});

describe('validateDefinition', () => {
  it('accepts a well-formed definition', () => {
    expect(validateDefinition([question(), question({ id: 'q2', position: 1 })])).toEqual([]);
  });

  it('rejects a question with no text', () => {
    expect(validateDefinition([question({ label: '  ' })])).toHaveLength(1);
  });

  it('rejects two questions in the same place', () => {
    const clashing = [question(), question({ id: 'q2', position: 0 })];

    expect(validateDefinition(clashing).some((p) => p.message.includes('mismo lugar'))).toBe(true);
  });

  it('reports every problem at once', () => {
    const broken = [
      question({ label: '' }),
      question({ id: 'q2', position: 1, type: 'single_choice', config: { options: ['Sí'] } }),
    ];

    expect(validateDefinition(broken)).toHaveLength(2);
  });
});

describe('changesMeaning', () => {
  const before = [
    question({ id: 'q1', label: 'Nombre' }),
    question({ id: 'q2', position: 1, type: 'single_choice', config: { options: ['A', 'B'] } }),
  ];

  it('is false for a reworded label', () => {
    // Old answers stay interpretable, so the version should not move.
    const after = [{ ...before[0]!, label: '¿Cómo te llamas?' }, before[1]!];

    expect(changesMeaning(before, after)).toBe(false);
  });

  it('is false for reordering', () => {
    expect(changesMeaning(before, [before[1]!, before[0]!])).toBe(false);
  });

  it('is true when a question is added', () => {
    expect(changesMeaning(before, [...before, question({ id: 'q3', position: 2 })])).toBe(true);
  });

  it('is true when a question is removed', () => {
    expect(changesMeaning(before, [before[0]!])).toBe(true);
  });

  it('is true when a question changes type', () => {
    const after = [{ ...before[0]!, type: 'number' as const }, before[1]!];

    expect(changesMeaning(before, after)).toBe(true);
  });

  it('is true when a question becomes required', () => {
    const after = [{ ...before[0]!, required: true }, before[1]!];

    expect(changesMeaning(before, after)).toBe(true);
  });

  it('is true when an option is removed, which orphans answers', () => {
    const after = [before[0]!, { ...before[1]!, config: { options: ['A'] } }];

    expect(changesMeaning(before, after)).toBe(true);
  });

  it('is false when an option is only added', () => {
    const after = [before[0]!, { ...before[1]!, config: { options: ['A', 'B', 'C'] } }];

    expect(changesMeaning(before, after)).toBe(false);
  });
});

describe('repositioned', () => {
  it('renumbers densely from zero', () => {
    const gappy = [question({ position: 5 }), question({ id: 'q2', position: 9 })];

    expect(repositioned(gappy).map((q) => q.position)).toEqual([0, 1]);
  });
});
