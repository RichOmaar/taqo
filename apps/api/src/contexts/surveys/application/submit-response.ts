import type { SurveyAnswer, SurveyResponse } from '@nexa/types';

import { ForbiddenError, NotFoundError, ValidationError } from '../../../shared/errors';
import { validateResponse } from '../domain/answer-validation';
import type { ResponseRepository, SurveyRepository } from '../domain/repositories';

/** Told about a completed feedback survey, so a rating can reach the metrics. */
export interface FeedbackProjector {
  recorded(subjectRef: string, rating: number | null, comment: string | null): void;
}

const NO_PROJECTION: FeedbackProjector = { recorded: () => undefined };

export interface SubmitInput {
  surveyId: string;
  /** What the response is about; a waitlist entry for a feedback survey. */
  subjectRef: string | null;
  answers: SurveyAnswer[];
}

/** Records a submission, validated against the definition it was given. */
export class SubmitResponse {
  constructor(
    private readonly surveys: SurveyRepository,
    private readonly responses: ResponseRepository,
    private readonly projector: FeedbackProjector = NO_PROJECTION,
  ) {}

  async execute(input: SubmitInput): Promise<SurveyResponse> {
    const survey = await this.surveys.findById(input.surveyId);
    if (!survey) throw new NotFoundError('No existe esa encuesta');

    // A draft has never been offered; a closed one deliberately stopped.
    if (survey.status !== 'active') {
      throw new ForbiddenError('Esa encuesta no está recibiendo respuestas');
    }

    const { problems, accepted } = validateResponse(survey.questions, input.answers);
    if (problems.length > 0) {
      throw new ValidationError('Revisa tus respuestas', { problems });
    }

    const stored = await this.responses.submit(
      survey.id,
      survey.version,
      input.subjectRef,
      accepted,
    );

    // Null means this subject already answered; the store's unique constraint
    // decided, so two racing submissions cannot both land.
    if (!stored) throw new ValidationError('Ya respondiste esta encuesta');

    if (survey.purpose === 'feedback' && input.subjectRef) {
      this.project(survey.questions, accepted, input.subjectRef);
    }

    return {
      id: stored.id,
      surveyId: survey.id,
      // The version answered against, not the current one: an edit after this
      // point must not change how these answers are read.
      surveyVersion: survey.version,
      subjectRef: input.subjectRef,
      answers: accepted,
      submittedAt: stored.submittedAt,
    };
  }

  /**
   * Mirrors a feedback survey into the existing review record.
   *
   * ServiceReview predates this context and still feeds the dashboard's rating
   * and its reviews list. Projecting keeps both working untouched rather than
   * migrating them behind a new feature on its first day.
   */
  private project(
    questions: SurveyResponseQuestions,
    answers: SurveyAnswer[],
    subjectRef: string,
  ): void {
    const byId = new Map(questions.map((question) => [question.id, question]));
    const valueOf = (predicate: (type: string) => boolean): SurveyAnswer | undefined =>
      answers.find((answer) => {
        const question = byId.get(answer.questionId);
        return question ? predicate(question.type) : false;
      });

    const rating = valueOf((type) => type === 'rating' || type === 'nps');
    const comment = valueOf((type) => type === 'long_text' || type === 'short_text');

    this.projector.recorded(
      subjectRef,
      typeof rating?.value === 'number' ? rating.value : null,
      typeof comment?.value === 'string' ? comment.value : null,
    );
  }
}

type SurveyResponseQuestions = { id: string; type: string }[];
