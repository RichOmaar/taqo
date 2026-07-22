import type { QuestionType, SurveyQuestion } from '@nexa/types';

/** Spanish labels for the question palette. */
export const QUESTION_LABELS: Record<QuestionType, string> = {
  short_text: 'Texto corto',
  long_text: 'Nota / comentario',
  number: 'Número',
  phone: 'Teléfono',
  email: 'Correo electrónico',
  single_choice: 'Opción única',
  multi_choice: 'Selección múltiple',
  rating: 'Calificación',
  nps: 'Recomendación (0–10)',
  boolean: 'Sí / No',
  date: 'Fecha',
};

/** Question types whose answers are chosen from a list the owner writes. */
export const CHOICE_TYPES: QuestionType[] = ['single_choice', 'multi_choice'];

/** A draft question, before the server has assigned it an id. */
export interface QuestionDraft extends Omit<SurveyQuestion, 'id'> {
  /** Absent for a question that has not been saved yet. */
  id?: string;
  /** Stable key for React and for reordering, id or not. */
  key: string;
}

let counter = 0;

/** Sensible starting shape per type, so a new question is usable immediately. */
export function newQuestion(type: QuestionType, position: number): QuestionDraft {
  counter += 1;

  return {
    key: `draft-${counter}`,
    type,
    label: '',
    helpText: null,
    required: false,
    position,
    config: CHOICE_TYPES.includes(type)
      ? { options: ['Opción 1', 'Opción 2'] }
      : type === 'rating'
        ? { maxRating: 5 }
        : {},
  };
}

export function toDrafts(questions: SurveyQuestion[]): QuestionDraft[] {
  return questions.map((question) => ({ ...question, key: question.id }));
}

/** Renumbers after a reorder, so positions stay dense and match the order shown. */
export function repositioned(questions: QuestionDraft[]): QuestionDraft[] {
  return questions.map((question, index) => ({ ...question, position: index }));
}

/**
 * The same checks the server runs, applied while the owner builds.
 *
 * The server stays the authority; this exists so a broken question is obvious
 * as it is written rather than after pressing save.
 */
export function questionProblem(question: QuestionDraft): string | null {
  if (!question.label.trim()) return 'Escribe el texto de la pregunta.';

  if (CHOICE_TYPES.includes(question.type)) {
    const options = question.config.options ?? [];
    if (options.length < 2) return 'Ofrece al menos 2 opciones.';
    if (options.some((option) => !option.trim())) return 'Las opciones no pueden ir vacías.';
    if (new Set(options).size !== options.length) return 'Hay una opción repetida.';
  }

  if (question.type === 'number') {
    const { min, max } = question.config;
    if (min !== undefined && max !== undefined && min >= max) {
      return 'El mínimo debe ser menor que el máximo.';
    }
  }

  return null;
}

/** The first problem across the whole form, or null when it is ready to save. */
export function definitionProblem(questions: QuestionDraft[]): string | null {
  for (const question of questions) {
    const problem = questionProblem(question);
    if (problem) return problem;
  }
  return null;
}
