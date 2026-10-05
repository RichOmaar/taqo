import type { Survey, SurveyAnswer, SurveyPurpose, SurveyStats, SurveyStatus } from '@nexa/types';

/** A question as the owner defines it; the store assigns the id. */
export interface QuestionDraft {
  /** Present when editing an existing question, absent when adding one. */
  id?: string;
  type: Survey['questions'][number]['type'];
  label: string;
  helpText: string | null;
  required: boolean;
  position: number;
  config: Survey['questions'][number]['config'];
}

export interface SurveyDraft {
  purpose: SurveyPurpose;
  title: string;
  description: string | null;
}

export interface SurveyRepository {
  findById(surveyId: string): Promise<Survey | null>;
  /** The owner's survey for a purpose; one of each at most. */
  findByOwner(ownerRef: string, purpose: SurveyPurpose): Promise<Survey | null>;
  listByOwner(ownerRef: string): Promise<Survey[]>;
  create(ownerRef: string, draft: SurveyDraft): Promise<Survey>;
  setStatus(surveyId: string, status: SurveyStatus): Promise<Survey>;
  /**
   * Replaces the question list, optionally bumping the version.
   *
   * Wholesale because positions are relative, and versioned only when the edit
   * changes what a stored answer means.
   */
  replaceQuestions(
    surveyId: string,
    questions: QuestionDraft[],
    bumpVersion: boolean,
  ): Promise<Survey>;
}

export interface ResponseRepository {
  /**
   * Records a submission, or returns null when this subject already answered.
   *
   * The uniqueness of (surveyId, subjectRef) is enforced by the store, so a
   * double submission loses there rather than in a read-then-write check.
   */
  submit(
    surveyId: string,
    surveyVersion: number,
    subjectRef: string | null,
    answers: SurveyAnswer[],
  ): Promise<{ id: string; submittedAt: string } | null>;
  stats(surveyId: string): Promise<SurveyStats>;
}
