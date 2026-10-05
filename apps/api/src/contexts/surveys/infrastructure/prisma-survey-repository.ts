import type { Survey, SurveyPurpose, SurveyQuestion, SurveyStatus } from '@nexa/types';
import { Prisma } from '@prisma/client';
import type {
  PrismaClient,
  Survey as PrismaSurvey,
  SurveyQuestion as PrismaQuestion,
} from '@prisma/client';

import type { QuestionDraft, SurveyDraft, SurveyRepository } from '../domain/repositories';

const WITH_QUESTIONS = { questions: { orderBy: { position: 'asc' } } } as const;

function toQuestion(row: PrismaQuestion): SurveyQuestion {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    helpText: row.helpText,
    required: row.required,
    position: row.position,
    // Stored as JSON because the shape depends on the question type; it was
    // validated on the way in.
    config: (row.config ?? {}) as SurveyQuestion['config'],
  };
}

function toSurvey(row: PrismaSurvey & { questions: PrismaQuestion[] }): Survey {
  return {
    id: row.id,
    ownerRef: row.ownerRef,
    purpose: row.purpose,
    title: row.title,
    description: row.description,
    status: row.status,
    version: row.version,
    questions: [...row.questions].sort((a, b) => a.position - b.position).map(toQuestion),
    createdAt: row.createdAt.toISOString(),
  };
}

export class PrismaSurveyRepository implements SurveyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(surveyId: string): Promise<Survey | null> {
    const row = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: WITH_QUESTIONS,
    });
    return row ? toSurvey(row) : null;
  }

  async findByOwner(ownerRef: string, purpose: SurveyPurpose): Promise<Survey | null> {
    const row = await this.prisma.survey.findFirst({
      where: { ownerRef, purpose },
      include: WITH_QUESTIONS,
      orderBy: { createdAt: 'asc' },
    });
    return row ? toSurvey(row) : null;
  }

  async listByOwner(ownerRef: string): Promise<Survey[]> {
    const rows = await this.prisma.survey.findMany({
      where: { ownerRef },
      include: WITH_QUESTIONS,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toSurvey);
  }

  async create(ownerRef: string, draft: SurveyDraft): Promise<Survey> {
    const row = await this.prisma.survey.create({
      data: { ownerRef, ...draft },
      include: WITH_QUESTIONS,
    });
    return toSurvey(row);
  }

  async setStatus(surveyId: string, status: SurveyStatus): Promise<Survey> {
    const row = await this.prisma.survey.update({
      where: { id: surveyId },
      data: { status },
      include: WITH_QUESTIONS,
    });
    return toSurvey(row);
  }

  /**
   * Swaps the question list in one transaction.
   *
   * Questions carry their answers by foreign key, so a question that survives
   * an edit must keep its id — deleting and recreating everything would cascade
   * away the responses. Existing ids are updated in place and only the genuinely
   * absent are removed.
   */
  async replaceQuestions(
    surveyId: string,
    questions: QuestionDraft[],
    bumpVersion: boolean,
  ): Promise<Survey> {
    const row = await this.prisma.$transaction(async (tx) => {
      const keptIds = questions.map((question) => question.id).filter((id): id is string => !!id);

      await tx.surveyQuestion.deleteMany({
        where: { surveyId, ...(keptIds.length > 0 && { id: { notIn: keptIds } }) },
      });

      // Positions are unique per survey, so shift the survivors out of the way
      // before writing the final ones; otherwise a reorder collides mid-update.
      await tx.surveyQuestion.updateMany({
        where: { surveyId },
        data: { position: { increment: 1000 } },
      });

      for (const question of questions) {
        const data = {
          type: question.type,
          label: question.label,
          helpText: question.helpText,
          required: question.required,
          position: question.position,
          // Config is type-dependent, so it is stored as JSON; it was validated
          // against its question type before reaching here.
          config: question.config as Prisma.InputJsonValue,
        };

        if (question.id) {
          await tx.surveyQuestion.update({ where: { id: question.id }, data });
        } else {
          await tx.surveyQuestion.create({ data: { surveyId, ...data } });
        }
      }

      return tx.survey.update({
        where: { id: surveyId },
        data: bumpVersion ? { version: { increment: 1 } } : {},
        include: WITH_QUESTIONS,
      });
    });

    return toSurvey(row);
  }
}
