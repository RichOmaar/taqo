import type { QuestionConfig, QuestionType, SurveyQuestion } from '@nexa/types';

/**
 * Rules about the definition itself, as opposed to the answers it collects.
 *
 * A question can be well-formed and still unanswerable — a single-choice with
 * one option, a rating out of one — and the time to catch that is while the
 * owner is building it, not when a diner hits a dead end.
 */

const CHOICE_TYPES: QuestionType[] = ['single_choice', 'multi_choice'];
const MIN_OPTIONS = 2;
const MIN_RATING_TOP = 2;
const MAX_RATING_TOP = 10;

export interface DefinitionProblem {
  questionId: string;
  message: string;
}

/** Checks one question's configuration. */
export function validateQuestionConfig(type: QuestionType, config: QuestionConfig): string | null {
  if (CHOICE_TYPES.includes(type)) {
    const options = config.options ?? [];
    // One option is not a choice, it is a statement.
    if (options.length < MIN_OPTIONS) return `Ofrece al menos ${MIN_OPTIONS} opciones`;
    if (options.some((option) => !option.trim())) return 'Las opciones no pueden ir vacías';
    if (new Set(options).size !== options.length) return 'No repitas una opción';
  }

  if (type === 'rating') {
    const top = config.maxRating ?? 5;
    if (top < MIN_RATING_TOP || top > MAX_RATING_TOP) {
      return `La escala debe ir de ${MIN_RATING_TOP} a ${MAX_RATING_TOP}`;
    }
  }

  if (type === 'number' && config.min !== undefined && config.max !== undefined) {
    if (config.min >= config.max) return 'El mínimo debe ser menor que el máximo';
  }

  if (config.maxLength !== undefined && config.maxLength < 1) {
    return 'El largo máximo debe ser al menos 1';
  }

  return null;
}

/** Checks a whole question list, reporting every problem at once. */
export function validateDefinition(questions: SurveyQuestion[]): DefinitionProblem[] {
  const problems: DefinitionProblem[] = [];

  for (const question of questions) {
    if (!question.label.trim()) {
      problems.push({ questionId: question.id, message: 'Cada pregunta necesita un texto' });
    }

    const problem = validateQuestionConfig(question.type, question.config);
    if (problem) problems.push({ questionId: question.id, message: problem });
  }

  const positions = questions.map((question) => question.position);
  if (new Set(positions).size !== positions.length) {
    problems.push({ questionId: '', message: 'Dos preguntas no pueden ocupar el mismo lugar' });
  }

  return problems;
}

/**
 * Whether an edit changes what a response would mean.
 *
 * Renaming a label leaves old answers interpretable; adding, removing, or
 * retyping a question does not. Only the latter earns a version bump, so the
 * version stays a signal rather than an edit counter.
 */
export function changesMeaning(before: SurveyQuestion[], after: SurveyQuestion[]): boolean {
  if (before.length !== after.length) return true;

  const byId = new Map(before.map((question) => [question.id, question]));

  return after.some((question) => {
    const previous = byId.get(question.id);
    if (!previous) return true;
    if (previous.type !== question.type) return true;
    if (previous.required !== question.required) return true;

    // Removing an option orphans answers that chose it; adding one does not.
    const had = previous.config.options ?? [];
    const has = question.config.options ?? [];
    return had.some((option) => !has.includes(option));
  });
}

/** Renumbers positions after a reorder, so they stay dense and ordered. */
export function repositioned(questions: SurveyQuestion[]): SurveyQuestion[] {
  return questions.map((question, index) => ({ ...question, position: index }));
}
