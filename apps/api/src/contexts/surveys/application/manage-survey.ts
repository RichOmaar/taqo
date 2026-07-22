import type { Survey, SurveyPurpose, SurveyQuestion } from '@nexa/types';

import { NotFoundError, ValidationError } from '../../../shared/errors';
import { changesMeaning, validateDefinition } from '../domain/definition-rules';
import type { QuestionDraft, SurveyDraft, SurveyRepository } from '../domain/repositories';

/**
 * The owner's authoring of a survey.
 *
 * Editing an active survey is allowed on purpose — waiting for a quiet moment
 * to fix a typo is not realistic — so the safety comes from versioning rather
 * than from locking the definition.
 */
export class ManageSurvey {
  constructor(private readonly surveys: SurveyRepository) {}

  async create(ownerRef: string, draft: SurveyDraft): Promise<Survey> {
    const existing = await this.surveys.findByOwner(ownerRef, draft.purpose);
    if (existing) {
      throw new ValidationError('Ya existe una encuesta para ese propósito');
    }
    if (!draft.title.trim()) throw new ValidationError('La encuesta necesita un título');

    return this.surveys.create(ownerRef, draft);
  }

  /**
   * Replaces the questions.
   *
   * The version moves only when the edit changes what a stored answer means —
   * a reworded label leaves old responses readable, a removed question does
   * not. Bumping on every save would make the version an edit counter and
   * strand every historical response behind it.
   */
  async updateDefinition(
    ownerRef: string,
    purpose: SurveyPurpose,
    questions: QuestionDraft[],
  ): Promise<Survey> {
    const survey = await this.require(ownerRef, purpose);

    const problems = validateDefinition(
      questions.map((question, index) => ({
        ...question,
        id: question.id ?? `new-${index}`,
      })) as SurveyQuestion[],
    );

    if (problems.length > 0) {
      throw new ValidationError('Revisa las preguntas', { problems });
    }

    const bump = changesMeaning(survey.questions, questions as SurveyQuestion[]);
    return this.surveys.replaceQuestions(survey.id, questions, bump);
  }

  /**
   * Opens the survey.
   *
   * A survey with no questions collects nothing and looks broken to whoever
   * opens it, which is worse than it simply not being offered.
   */
  async publish(ownerRef: string, purpose: SurveyPurpose): Promise<Survey> {
    const survey = await this.require(ownerRef, purpose);
    if (survey.questions.length === 0) {
      throw new ValidationError('Agrega al menos una pregunta antes de publicar');
    }
    return this.surveys.setStatus(survey.id, 'active');
  }

  /** Stops collecting without deleting what was already answered. */
  async close(ownerRef: string, purpose: SurveyPurpose): Promise<Survey> {
    const survey = await this.require(ownerRef, purpose);
    return this.surveys.setStatus(survey.id, 'closed');
  }

  private async require(ownerRef: string, purpose: SurveyPurpose): Promise<Survey> {
    const survey = await this.surveys.findByOwner(ownerRef, purpose);
    if (!survey) throw new NotFoundError('No existe esa encuesta');
    return survey;
  }
}
