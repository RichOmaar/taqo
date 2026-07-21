import type { QuestionConfig, QuestionType, SurveyQuestion } from '@nexa/types';
import { describe, expect, it } from 'vitest';

import { validateAnswer, validateResponse } from './answer-validation';

function question(
  type: QuestionType,
  config: QuestionConfig = {},
  overrides: Partial<SurveyQuestion> = {},
): SurveyQuestion {
  return {
    id: `q-${type}`,
    type,
    label: `Pregunta ${type}`,
    helpText: null,
    required: false,
    position: 0,
    config,
    ...overrides,
  };
}

describe('validateAnswer', () => {
  describe('text', () => {
    it('accepts a string', () => {
      expect(validateAnswer(question('short_text'), 'Hola')).toBeNull();
    });

    it('rejects a non-string', () => {
      expect(validateAnswer(question('short_text'), 42)).toBe('Se esperaba texto');
    });

    it('enforces the configured length', () => {
      expect(validateAnswer(question('short_text', { maxLength: 3 }), 'Hola')).toContain(
        'Máximo 3',
      );
    });
  });

  describe('number', () => {
    it('accepts a number in range', () => {
      expect(validateAnswer(question('number', { min: 1, max: 10 }), 5)).toBeNull();
    });

    it('rejects below the minimum and above the maximum', () => {
      const q = question('number', { min: 2, max: 4 });

      expect(validateAnswer(q, 1)).toContain('Mínimo');
      expect(validateAnswer(q, 9)).toContain('Máximo');
    });

    it('rejects NaN, which is technically a number', () => {
      expect(validateAnswer(question('number'), Number.NaN)).toBe('Se esperaba un número');
    });
  });

  describe('email', () => {
    it.each(['ana@demo.mx', 'a.b+c@sub.domain.com'])('accepts %s', (value) => {
      expect(validateAnswer(question('email'), value)).toBeNull();
    });

    it.each(['ana', 'ana@', '@demo.mx', 'ana@demo', 'a b@demo.mx', 'a@b@c.mx'])(
      'rejects %s',
      (value) => {
        expect(validateAnswer(question('email'), value)).toBe('Correo inválido');
      },
    );

    it('does not hang on a long hostile input', () => {
      // The naive pattern backtracks super-linearly on exactly this shape.
      const hostile = `${'a'.repeat(40_000)}@`;
      const started = Date.now();

      validateAnswer(question('email'), hostile);

      expect(Date.now() - started).toBeLessThan(200);
    });
  });

  describe('phone', () => {
    it.each(['+52 55 1234 5678', '5551234567', '(55) 1234-5678'])('accepts %s', (value) => {
      expect(validateAnswer(question('phone'), value)).toBeNull();
    });

    it.each(['123', 'no-soy-un-teléfono'])('rejects %s', (value) => {
      expect(validateAnswer(question('phone'), value)).toBe('Teléfono inválido');
    });
  });

  describe('single choice', () => {
    const q = question('single_choice', { options: ['Terraza', 'Interior'] });

    it('accepts a listed option', () => {
      expect(validateAnswer(q, 'Terraza')).toBeNull();
    });

    it('rejects an option that is not offered', () => {
      // Otherwise a caller can write anything into the distribution.
      expect(validateAnswer(q, 'Cocina')).toBe('Esa opción no existe');
    });
  });

  describe('multi choice', () => {
    const q = question('multi_choice', { options: ['Vegano', 'Sin gluten', 'Sin lactosa'] });

    it('accepts a subset', () => {
      expect(validateAnswer(q, ['Vegano', 'Sin gluten'])).toBeNull();
    });

    it('accepts an empty selection, which optionality decides', () => {
      expect(validateAnswer(q, [])).toBeNull();
    });

    it('rejects an unlisted option', () => {
      expect(validateAnswer(q, ['Vegano', 'Carnívoro'])).toBe('Esa opción no existe');
    });

    it('rejects a repeat, which would double-count', () => {
      expect(validateAnswer(q, ['Vegano', 'Vegano'])).toBe('No repitas una opción');
    });
  });

  describe('rating', () => {
    it('accepts within the configured scale', () => {
      expect(validateAnswer(question('rating', { maxRating: 5 }), 5)).toBeNull();
    });

    it('rejects zero and beyond the top', () => {
      const q = question('rating', { maxRating: 5 });

      expect(validateAnswer(q, 0)).toContain('entre 1 y 5');
      expect(validateAnswer(q, 6)).toContain('entre 1 y 5');
    });

    it('respects a non-default scale', () => {
      expect(validateAnswer(question('rating', { maxRating: 10 }), 8)).toBeNull();
    });

    it('rejects a fraction', () => {
      expect(validateAnswer(question('rating'), 4.5)).toBe('Se esperaba una calificación');
    });
  });

  describe('nps', () => {
    it('accepts the whole 0 to 10 scale, including zero', () => {
      expect(validateAnswer(question('nps'), 0)).toBeNull();
      expect(validateAnswer(question('nps'), 10)).toBeNull();
    });

    it('rejects 11', () => {
      expect(validateAnswer(question('nps'), 11)).toContain('entre 0 y 10');
    });
  });

  describe('boolean', () => {
    it('accepts true and false', () => {
      expect(validateAnswer(question('boolean'), true)).toBeNull();
      expect(validateAnswer(question('boolean'), false)).toBeNull();
    });

    it('rejects a string that looks like a boolean', () => {
      expect(validateAnswer(question('boolean'), 'true')).toBe('Se esperaba sí o no');
    });
  });

  describe('date', () => {
    it('accepts an ISO date', () => {
      expect(validateAnswer(question('date'), '2026-07-21')).toBeNull();
    });

    it('rejects another format', () => {
      expect(validateAnswer(question('date'), '21/07/2026')).toBe('Formato de fecha inválido');
    });

    it('rejects a well-formed impossible date', () => {
      expect(validateAnswer(question('date'), '2026-13-45')).toBe('Fecha inválida');
    });
  });
});

describe('validateResponse', () => {
  const name = question('short_text', {}, { id: 'q1', required: true, label: 'Nombre' });
  const party = question('number', { min: 1, max: 20 }, { id: 'q2', position: 1 });

  it('accepts a complete submission', () => {
    const result = validateResponse(
      [name, party],
      [
        { questionId: 'q1', value: 'Ana' },
        { questionId: 'q2', value: 4 },
      ],
    );

    expect(result.problems).toEqual([]);
    expect(result.accepted).toHaveLength(2);
  });

  it('reports a missing required answer', () => {
    const result = validateResponse([name], []);

    expect(result.problems).toEqual([
      { questionId: 'q1', message: 'Esta pregunta es obligatoria' },
    ]);
  });

  it('treats whitespace as missing', () => {
    const result = validateResponse([name], [{ questionId: 'q1', value: '   ' }]);

    expect(result.problems).toHaveLength(1);
  });

  it('lets an optional question go unanswered', () => {
    const result = validateResponse([party], []);

    expect(result.problems).toEqual([]);
    expect(result.accepted).toEqual([]);
  });

  it('drops an answer to a question that no longer exists', () => {
    // The diner opened the form before the owner edited it. Losing their whole
    // submission over a deleted question is the wrong trade.
    const result = validateResponse(
      [name],
      [
        { questionId: 'q1', value: 'Ana' },
        { questionId: 'deleted', value: 'algo' },
      ],
    );

    expect(result.problems).toEqual([]);
    expect(result.accepted).toEqual([{ questionId: 'q1', value: 'Ana' }]);
  });

  it('reports every problem at once, not just the first', () => {
    // Fixing a form one error per submission is a miserable way to fill it in.
    const result = validateResponse(
      [name, party],
      [
        { questionId: 'q1', value: '' },
        { questionId: 'q2', value: 99 },
      ],
    );

    expect(result.problems).toHaveLength(2);
  });

  it('accepts nothing when everything is invalid', () => {
    const result = validateResponse([party], [{ questionId: 'q2', value: 'cuatro' }]);

    expect(result.accepted).toEqual([]);
  });
});
