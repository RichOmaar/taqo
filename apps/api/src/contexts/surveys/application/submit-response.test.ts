import type { Survey, SurveyQuestion, SurveyStatus } from '@nexa/types';
import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError, NotFoundError, ValidationError } from '../../../shared/errors';
import type { ResponseRepository, SurveyRepository } from '../domain/repositories';
import { SubmitResponse, type FeedbackProjector } from './submit-response';

function question(overrides: Partial<SurveyQuestion> = {}): SurveyQuestion {
  return {
    id: 'q1',
    type: 'rating',
    label: '¿Cómo estuvo todo?',
    helpText: null,
    required: true,
    position: 0,
    config: { maxRating: 5 },
    ...overrides,
  };
}

function survey(overrides: Partial<Survey> = {}): Survey {
  return {
    id: 's1',
    ownerRef: 'r1',
    purpose: 'feedback',
    title: 'Tu experiencia',
    description: null,
    status: 'active',
    version: 3,
    questions: [
      question(),
      question({ id: 'q2', type: 'long_text', label: 'Comentarios', required: false, position: 1 }),
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function build(options: { found?: Survey | null; duplicate?: boolean } = {}) {
  const { found = survey(), duplicate = false } = options;

  const submit = vi
    .fn<ResponseRepository['submit']>()
    .mockResolvedValue(duplicate ? null : { id: 'resp1', submittedAt: '2026-07-21T20:00:00.000Z' });
  const recorded = vi.fn<FeedbackProjector['recorded']>();

  return {
    submit,
    recorded,
    useCase: new SubmitResponse(
      { findById: () => Promise.resolve(found) } as unknown as SurveyRepository,
      { submit } as unknown as ResponseRepository,
      { recorded },
    ),
  };
}

const GOOD = [
  { questionId: 'q1', value: 5 },
  { questionId: 'q2', value: 'Todo excelente' },
];

describe('SubmitResponse', () => {
  it('records a valid submission', async () => {
    const { useCase } = build();

    const result = await useCase.execute({ surveyId: 's1', subjectRef: 'e1', answers: GOOD });

    expect(result).toMatchObject({ id: 'resp1', subjectRef: 'e1' });
  });

  it('stamps the version answered against, not the current one', async () => {
    // An edit after this point must not change how these answers are read.
    const { submit, useCase } = build();

    const result = await useCase.execute({ surveyId: 's1', subjectRef: 'e1', answers: GOOD });

    expect(result.surveyVersion).toBe(3);
    expect(submit.mock.calls[0]?.[1]).toBe(3);
  });

  it('rejects a submission that fails validation, before writing anything', async () => {
    const { submit, useCase } = build();

    await expect(
      useCase.execute({
        surveyId: 's1',
        subjectRef: 'e1',
        answers: [{ questionId: 'q1', value: 9 }],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(submit).not.toHaveBeenCalled();
  });

  it('rejects a missing required answer', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute({ surveyId: 's1', subjectRef: 'e1', answers: [] }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('stores only the answers that passed', async () => {
    const { submit, useCase } = build();

    await useCase.execute({
      surveyId: 's1',
      subjectRef: 'e1',
      answers: [...GOOD, { questionId: 'ghost', value: 'de una versión vieja' }],
    });

    expect(submit.mock.calls[0]?.[3]).toEqual(GOOD);
  });

  it.each<SurveyStatus>(['draft', 'closed'])('refuses a %s survey', async (status) => {
    const { useCase } = build({ found: survey({ status }) });

    await expect(
      useCase.execute({ surveyId: 's1', subjectRef: 'e1', answers: GOOD }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('reports an unknown survey', async () => {
    const { useCase } = build({ found: null });

    await expect(
      useCase.execute({ surveyId: 'nope', subjectRef: null, answers: [] }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('refuses a second submission from the same subject', async () => {
    // The store's unique constraint decides, so a double tap cannot both land.
    const { useCase } = build({ duplicate: true });

    await expect(
      useCase.execute({ surveyId: 's1', subjectRef: 'e1', answers: GOOD }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  describe('projection into the existing review record', () => {
    it('mirrors the rating and the comment', async () => {
      // ServiceReview still feeds the dashboard, so it keeps working untouched.
      const { recorded, useCase } = build();

      await useCase.execute({ surveyId: 's1', subjectRef: 'e1', answers: GOOD });

      expect(recorded).toHaveBeenCalledWith('e1', 5, 'Todo excelente');
    });

    it('passes null for a rating the survey never asked for', async () => {
      const textOnly = survey({
        questions: [question({ id: 'q2', type: 'long_text', required: false, position: 0 })],
      });
      const { recorded, useCase } = build({ found: textOnly });

      await useCase.execute({
        surveyId: 's1',
        subjectRef: 'e1',
        answers: [{ questionId: 'q2', value: 'Sin calificación' }],
      });

      expect(recorded).toHaveBeenCalledWith('e1', null, 'Sin calificación');
    });

    it('does not project an intake form, which is not feedback', async () => {
      const { recorded, useCase } = build({ found: survey({ purpose: 'intake' }) });

      await useCase.execute({ surveyId: 's1', subjectRef: 'e1', answers: GOOD });

      expect(recorded).not.toHaveBeenCalled();
    });

    it('does not project without a subject to attach it to', async () => {
      const { recorded, useCase } = build();

      await useCase.execute({ surveyId: 's1', subjectRef: null, answers: GOOD });

      expect(recorded).not.toHaveBeenCalled();
    });
  });
});
