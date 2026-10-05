import type { AnswerValue, QuestionStats, SurveyAnswer, SurveyStats } from '@nexa/types';
import { Prisma, type PrismaClient } from '@prisma/client';

import type { ResponseRepository } from '../domain/repositories';

/** How many verbatim answers to keep for a free-text question. */
const TEXT_SAMPLES = 5;
const NUMERIC_TYPES = new Set(['rating', 'nps', 'number']);
const TEXT_TYPES = new Set(['short_text', 'long_text']);

export class PrismaResponseRepository implements ResponseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Records a submission, or reports that this subject already answered.
   *
   * The unique (surveyId, subjectRef) index decides, not a prior read: two
   * concurrent submissions would both pass a read-then-write check.
   */
  async submit(
    surveyId: string,
    surveyVersion: number,
    subjectRef: string | null,
    answers: SurveyAnswer[],
  ): Promise<{ id: string; submittedAt: string } | null> {
    try {
      const row = await this.prisma.surveyResponse.create({
        data: {
          surveyId,
          surveyVersion,
          subjectRef,
          answers: {
            create: answers.map((answer) => ({
              questionId: answer.questionId,
              value: answer.value as Prisma.InputJsonValue,
            })),
          },
        },
      });

      return { id: row.id, submittedAt: row.submittedAt.toISOString() };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Results per question.
   *
   * Aggregated in JS rather than SQL because the answers are JSON whose shape
   * follows the question type — a rating averages, a multi-choice counts each
   * selection separately — and expressing that per-type branching in one query
   * would be far harder to read than the loop below.
   */
  async stats(surveyId: string): Promise<SurveyStats> {
    const [questions, responses] = await Promise.all([
      this.prisma.surveyQuestion.findMany({
        where: { surveyId },
        orderBy: { position: 'asc' },
      }),
      this.prisma.surveyResponse.findMany({
        where: { surveyId },
        include: { answers: true },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    const byQuestion = new Map<string, AnswerValue[]>();
    for (const response of responses) {
      for (const answer of response.answers) {
        const values = byQuestion.get(answer.questionId) ?? [];
        values.push(answer.value as AnswerValue);
        byQuestion.set(answer.questionId, values);
      }
    }

    const stats: QuestionStats[] = questions.map((question) => {
      const values = byQuestion.get(question.id) ?? [];

      return {
        questionId: question.id,
        label: question.label,
        type: question.type,
        answered: values.length,
        average: NUMERIC_TYPES.has(question.type) ? averageOf(values) : null,
        distribution: TEXT_TYPES.has(question.type) ? [] : distributionOf(values),
        samples: TEXT_TYPES.has(question.type) ? samplesOf(values) : [],
      };
    });

    return { responses: responses.length, questions: stats };
  }
}

function averageOf(values: AnswerValue[]): number | null {
  const numbers = values.filter((value): value is number => typeof value === 'number');
  if (numbers.length === 0) return null;
  return Number((numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(1));
}

/** Counts each selection; a multi-choice answer contributes once per option. */
function distributionOf(values: AnswerValue[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const selections = Array.isArray(value) ? value : [String(value)];
    for (const selection of selections) {
      counts.set(selection, (counts.get(selection) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function samplesOf(values: AnswerValue[]): string[] {
  return values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .slice(0, TEXT_SAMPLES);
}
