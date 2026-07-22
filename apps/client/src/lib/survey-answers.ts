import type { AnswerValue, SurveyAnswer, SurveyQuestion } from '@nexa/types';

export type Answers = Record<string, AnswerValue>;

/**
 * Whether the diner actually gave an answer.
 *
 * The traps are `0` (a real NPS score, and the worst one) and `false` (a real
 * answer to a yes/no question). Both are falsy, so a truthiness check would
 * silently drop the two answers a restaurant most needs to see.
 */
export function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  return true;
}

/** Problems to show before submitting, keyed by question id. */
export function missingRequired(
  questions: SurveyQuestion[],
  answers: Answers,
): Record<string, string> {
  const problems: Record<string, string> = {};

  for (const question of questions) {
    if (question.required && !isAnswered(answers[question.id])) {
      problems[question.id] = 'Esta pregunta es obligatoria.';
    }
  }

  return problems;
}

/**
 * The submission payload.
 *
 * Unanswered optional questions are omitted rather than sent as empty: the
 * server validates each answer against its question, and "" is not a valid
 * rating. Trims text so a spacebar tap does not read as a comment.
 */
export function toAnswers(questions: SurveyQuestion[], answers: Answers): SurveyAnswer[] {
  return questions
    .filter((question) => isAnswered(answers[question.id]))
    .map((question) => {
      const value = answers[question.id] as AnswerValue;
      return {
        questionId: question.id,
        value: typeof value === 'string' ? value.trim() : value,
      };
    });
}
