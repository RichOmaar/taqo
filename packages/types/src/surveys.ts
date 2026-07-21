import type { ISODateString, UUID } from './common';

/**
 * What a survey is for.
 *
 * One engine, two destinations: the same builder produces the form a diner
 * fills to join the queue and the questions asked after they leave.
 */
export const SURVEY_PURPOSES = ['intake', 'feedback'] as const;
export type SurveyPurpose = (typeof SURVEY_PURPOSES)[number];

export const SURVEY_STATUSES = ['draft', 'active', 'closed'] as const;
export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

/**
 * The question types the MVP supports.
 *
 * Deliberately finite. Conditional logic, branching and multi-page come later;
 * versioned definitions are what make adding them safe.
 */
export const QUESTION_TYPES = [
  'short_text',
  'long_text',
  'number',
  'phone',
  'email',
  'single_choice',
  'multi_choice',
  'rating',
  'nps',
  'boolean',
  'date',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Type-specific settings. Which fields apply depends on the question type. */
export interface QuestionConfig {
  /** single_choice, multi_choice. */
  options?: string[];
  /** rating — the top of the scale, e.g. 5 stars. */
  maxRating?: number;
  /** number. */
  min?: number;
  max?: number;
  /** short_text, long_text. */
  maxLength?: number;
}

export interface SurveyQuestion {
  id: UUID;
  type: QuestionType;
  label: string;
  helpText: string | null;
  required: boolean;
  /** Ascending from 0. */
  position: number;
  config: QuestionConfig;
}

/**
 * A survey definition.
 *
 * `ownerRef` is opaque rather than a restaurant foreign key, and `version` is
 * bumped whenever the questions change, so a response stays interpretable
 * against the definition that was actually answered.
 */
export interface Survey {
  id: UUID;
  ownerRef: string;
  purpose: SurveyPurpose;
  title: string;
  description: string | null;
  status: SurveyStatus;
  version: number;
  questions: SurveyQuestion[];
  createdAt: ISODateString;
}

/** Shape depends on the question type; validated against the definition. */
export type AnswerValue = string | number | boolean | string[];

export interface SurveyAnswer {
  questionId: UUID;
  value: AnswerValue;
}

export interface SurveyResponse {
  id: UUID;
  surveyId: UUID;
  /** The definition version this was answered against. */
  surveyVersion: number;
  /** What the response is about — a waitlist entry, for a feedback survey. */
  subjectRef: string | null;
  answers: SurveyAnswer[];
  submittedAt: ISODateString;
}

/** One bar of a choice or boolean breakdown. */
export interface AnswerCount {
  value: string;
  count: number;
}

/**
 * Results for one question.
 *
 * Which fields are populated follows the question type: a rating has an
 * average, a choice has a distribution, free text has samples.
 */
export interface QuestionStats {
  questionId: UUID;
  label: string;
  type: QuestionType;
  /** How many responses answered this question at all. */
  answered: number;
  average: number | null;
  distribution: AnswerCount[];
  /** A handful of verbatim answers, for the free-text types. */
  samples: string[];
}

export interface SurveyStats {
  responses: number;
  questions: QuestionStats[];
}

// API responses.

export interface SurveyResponsePayload {
  survey: Survey;
}

export interface ListSurveysResponse {
  surveys: Survey[];
}

export interface SubmitSurveyResponse {
  response: SurveyResponse;
}

export interface SurveyStatsResponse {
  stats: SurveyStats;
}
