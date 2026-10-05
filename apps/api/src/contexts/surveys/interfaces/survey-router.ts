import { QUESTION_TYPES, SURVEY_PURPOSES } from '@nexa/types';
import { Router } from 'express';
import { z } from 'zod';

import { requireStaff } from '../../../http/middleware/require-staff';
import { requireRestaurantScope } from '../../../http/middleware/restaurant-scope';
import { NotFoundError, ValidationError } from '../../../shared/errors';
import type { RestaurantRepository } from '../../restaurant/domain/restaurant-repository';
import type { ManageSurvey } from '../application/manage-survey';
import type { SubmitResponse } from '../application/submit-response';
import type { ResponseRepository, SurveyRepository } from '../domain/repositories';

const purposeParam = z.enum(SURVEY_PURPOSES);

const createSchema = z.object({
  purpose: purposeParam,
  title: z.string().min(1).max(120),
  description: z.string().max(400).nullable().default(null),
});

const questionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        type: z.enum(QUESTION_TYPES),
        label: z.string().min(1).max(200),
        helpText: z.string().max(300).nullable().default(null),
        required: z.boolean().default(false),
        position: z.number().int().min(0).max(50),
        config: z
          .object({
            options: z.array(z.string().max(120)).max(20).optional(),
            maxRating: z.number().int().min(2).max(10).optional(),
            min: z.number().optional(),
            max: z.number().optional(),
            maxLength: z.number().int().min(1).max(5000).optional(),
          })
          .default({}),
      }),
    )
    .max(30),
});

/** An answer's shape depends on its question; the domain validates it properly. */
const answerValue = z.union([z.string(), z.number(), z.boolean(), z.array(z.string()).max(20)]);

const submitSchema = z.object({
  subjectRef: z.string().max(120).nullable().default(null),
  answers: z.array(z.object({ questionId: z.string().uuid(), value: answerValue })).max(50),
});

/**
 * Owner routes configure a survey and read its results; the public route
 * answers one. Reading a definition is deliberately open: a diner filling an
 * intake form has no account yet.
 */
export function surveyRouter(
  restaurants: RestaurantRepository,
  surveys: SurveyRepository,
  responses: ResponseRepository,
  manage: ManageSurvey,
  submit: SubmitResponse,
): Router {
  const router = Router();

  const scopeByCode = requireRestaurantScope((req) =>
    restaurants.findIdByCode(String(req.params.code)),
  );

  async function ownerRefFor(code: string): Promise<string> {
    const id = await restaurants.findIdByCode(code);
    if (!id) throw new NotFoundError('Restaurant not found');
    return id;
  }

  router.get('/restaurants/:code/surveys', requireStaff, scopeByCode, async (req, res, next) => {
    try {
      const ownerRef = await ownerRefFor(String(req.params.code));
      res.json({ surveys: await surveys.listByOwner(ownerRef) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/restaurants/:code/surveys', requireStaff, scopeByCode, async (req, res, next) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Encuesta inválida', { issues: parsed.error.issues });
      }
      const ownerRef = await ownerRefFor(String(req.params.code));
      res.status(201).json({ survey: await manage.create(ownerRef, parsed.data) });
    } catch (error) {
      next(error);
    }
  });

  router.put(
    '/restaurants/:code/surveys/:purpose/questions',
    requireStaff,
    scopeByCode,
    async (req, res, next) => {
      try {
        const purpose = purposeParam.safeParse(req.params.purpose);
        if (!purpose.success) throw new ValidationError('Propósito inválido');

        const parsed = questionsSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Preguntas inválidas', { issues: parsed.error.issues });
        }

        const ownerRef = await ownerRefFor(String(req.params.code));
        const survey = await manage.updateDefinition(ownerRef, purpose.data, parsed.data.questions);
        res.json({ survey });
      } catch (error) {
        next(error);
      }
    },
  );

  for (const action of ['publish', 'close'] as const) {
    router.post(
      `/restaurants/:code/surveys/:purpose/${action}`,
      requireStaff,
      scopeByCode,
      async (req, res, next) => {
        try {
          const purpose = purposeParam.safeParse(req.params.purpose);
          if (!purpose.success) throw new ValidationError('Propósito inválido');

          const ownerRef = await ownerRefFor(String(req.params.code));
          const survey =
            action === 'publish'
              ? await manage.publish(ownerRef, purpose.data)
              : await manage.close(ownerRef, purpose.data);
          res.json({ survey });
        } catch (error) {
          next(error);
        }
      },
    );
  }

  router.get(
    '/restaurants/:code/surveys/:purpose/stats',
    requireStaff,
    scopeByCode,
    async (req, res, next) => {
      try {
        const purpose = purposeParam.safeParse(req.params.purpose);
        if (!purpose.success) throw new ValidationError('Propósito inválido');

        const ownerRef = await ownerRefFor(String(req.params.code));
        const survey = await surveys.findByOwner(ownerRef, purpose.data);
        if (!survey) throw new NotFoundError('No existe esa encuesta');

        res.json({ stats: await responses.stats(survey.id) });
      } catch (error) {
        next(error);
      }
    },
  );

  // ---- Public: reading and answering a live survey -------------------------

  router.get('/restaurants/:code/surveys/:purpose/active', async (req, res, next) => {
    try {
      const purpose = purposeParam.safeParse(req.params.purpose);
      if (!purpose.success) throw new ValidationError('Propósito inválido');

      const ownerRef = await ownerRefFor(String(req.params.code));
      const survey = await surveys.findByOwner(ownerRef, purpose.data);

      // Null rather than 404: "this restaurant asks nothing" is a normal
      // answer, and the caller renders its default form instead.
      res.json({ survey: survey?.status === 'active' ? survey : null });
    } catch (error) {
      next(error);
    }
  });

  router.post('/surveys/:surveyId/responses', async (req, res, next) => {
    try {
      const parsed = submitSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Respuestas inválidas', { issues: parsed.error.issues });
      }

      const response = await submit.execute({
        surveyId: String(req.params.surveyId),
        subjectRef: parsed.data.subjectRef,
        answers: parsed.data.answers,
      });
      res.status(201).json({ response });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
