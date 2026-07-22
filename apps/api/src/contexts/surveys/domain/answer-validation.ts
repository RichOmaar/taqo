import type {
  AnswerValue,
  QuestionConfig,
  QuestionType,
  SurveyAnswer,
  SurveyQuestion,
} from '@nexa/types';

/**
 * Answer validation.
 *
 * A survey definition is data, so an answer cannot be type-checked at compile
 * time — these rules are the only thing between a configurable form and a table
 * of unusable values.
 *
 * One validator per question type, each a pure function of the value and the
 * question's config, so a type's rules can be read and tested on their own.
 */

export interface AnswerProblem {
  questionId: string;
  message: string;
}

const DEFAULT_MAX_LENGTH = 500;
const DEFAULT_MAX_RATING = 5;
const NPS_MAX = 10;

type Validator = (value: AnswerValue, config: QuestionConfig) => string | null;

/**
 * Linear email check.
 *
 * Split rather than matched: the obvious pattern (`[^\s@]+@[^\s@]+\.[^\s@]+`)
 * has overlapping character classes either side of the dot, so it backtracks
 * super-linearly on a hostile input.
 */
function looksLikeEmail(value: string): boolean {
  if (/\s/.test(value)) return false;

  const parts = value.split('@');
  if (parts.length !== 2) return false;

  const [local = '', domain = ''] = parts;
  if (!local || !domain) return false;

  const lastDot = domain.lastIndexOf('.');
  return lastDot > 0 && lastDot < domain.length - 1;
}

/** Characters a person might reasonably type into a phone field. */
const PHONE_SHAPE = /^[+(\d][\d\s()+-]*$/;
/** E.164 allows at most 15 digits; 7 is the shortest plausible local number. */
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

/**
 * Counts digits rather than matching a full pattern.
 *
 * Formatting varies more than a pattern can usefully capture — "(55) 1234-5678"
 * and "+52 55 1234 5678" are the same number written by different people — so
 * the rule is about how many digits there are, not where the brackets went.
 */
function looksLikePhone(value: string): boolean {
  if (!PHONE_SHAPE.test(value)) return false;
  const digits = value.replace(/\D/g, '').length;
  return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const text: Validator = (value, config) => {
  if (typeof value !== 'string') return 'Se esperaba texto';
  const limit = config.maxLength ?? DEFAULT_MAX_LENGTH;
  return value.length > limit ? `Máximo ${limit} caracteres` : null;
};

const numeric: Validator = (value, config) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Se esperaba un número';
  if (config.min !== undefined && value < config.min) return `Mínimo ${config.min}`;
  if (config.max !== undefined && value > config.max) return `Máximo ${config.max}`;
  return null;
};

const email: Validator = (value) => {
  if (typeof value !== 'string') return 'Se esperaba texto';
  return looksLikeEmail(value.trim()) ? null : 'Correo inválido';
};

const phone: Validator = (value) => {
  if (typeof value !== 'string') return 'Se esperaba texto';
  return looksLikePhone(value.trim()) ? null : 'Teléfono inválido';
};

const singleChoice: Validator = (value, config) => {
  if (typeof value !== 'string') return 'Se esperaba una opción';
  return (config.options ?? []).includes(value) ? null : 'Esa opción no existe';
};

const multiChoice: Validator = (value, config) => {
  if (!Array.isArray(value)) return 'Se esperaban opciones';

  const options = config.options ?? [];
  if (value.some((item) => !options.includes(item))) return 'Esa opción no existe';

  // A repeated choice would double-count in the distribution.
  return new Set(value).size === value.length ? null : 'No repitas una opción';
};

const rating: Validator = (value, config) => {
  const top = config.maxRating ?? DEFAULT_MAX_RATING;
  if (typeof value !== 'number' || !Number.isInteger(value)) return 'Se esperaba una calificación';
  return value >= 1 && value <= top ? null : `Califica entre 1 y ${top}`;
};

const nps: Validator = (value) => {
  if (typeof value !== 'number' || !Number.isInteger(value)) return 'Se esperaba un número';
  return value >= 0 && value <= NPS_MAX ? null : `Elige entre 0 y ${NPS_MAX}`;
};

const yesNo: Validator = (value) => (typeof value === 'boolean' ? null : 'Se esperaba sí o no');

const date: Validator = (value) => {
  if (typeof value !== 'string') return 'Se esperaba una fecha';
  if (!ISO_DATE.test(value)) return 'Formato de fecha inválido';
  return Number.isNaN(Date.parse(value)) ? 'Fecha inválida' : null;
};

const VALIDATORS: Record<QuestionType, Validator> = {
  short_text: text,
  long_text: text,
  number: numeric,
  phone,
  email,
  single_choice: singleChoice,
  multi_choice: multiChoice,
  rating,
  nps,
  boolean: yesNo,
  date,
};

/** Validates one answer, returning a reason when it is unusable. */
export function validateAnswer(question: SurveyQuestion, value: AnswerValue): string | null {
  const validator = VALIDATORS[question.type];
  return validator ? validator(value, question.config) : 'Tipo de pregunta desconocido';
}

function isBlank(value: AnswerValue): boolean {
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return value === null || value === undefined;
}

/**
 * Validates a whole submission against a definition.
 *
 * Answers to questions that no longer exist are dropped rather than rejected: a
 * diner may have opened the form before the owner edited it, and losing their
 * whole submission over a question that has since gone is the wrong trade.
 */
export function validateResponse(
  questions: SurveyQuestion[],
  answers: SurveyAnswer[],
): { problems: AnswerProblem[]; accepted: SurveyAnswer[] } {
  const answered = new Map(answers.map((answer) => [answer.questionId, answer.value]));
  const problems: AnswerProblem[] = [];
  const accepted: SurveyAnswer[] = [];

  // Iterating the definition rather than the submission is what drops answers
  // to questions that no longer exist: they simply never come up.
  for (const question of questions) {
    const value = answered.get(question.id);

    if (value === undefined || isBlank(value)) {
      if (question.required) {
        problems.push({ questionId: question.id, message: 'Esta pregunta es obligatoria' });
      }
      continue;
    }

    const problem = validateAnswer(question, value);
    if (problem) problems.push({ questionId: question.id, message: problem });
    else accepted.push({ questionId: question.id, value });
  }

  return { problems, accepted };
}
