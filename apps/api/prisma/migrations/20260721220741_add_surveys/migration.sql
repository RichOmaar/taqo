-- CreateEnum
CREATE TYPE "SurveyPurpose" AS ENUM ('intake', 'feedback');

-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('draft', 'active', 'closed');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('short_text', 'long_text', 'number', 'phone', 'email', 'single_choice', 'multi_choice', 'rating', 'nps', 'boolean', 'date');

-- CreateTable
CREATE TABLE "surveys" (
    "id" UUID NOT NULL,
    "owner_ref" TEXT NOT NULL,
    "purpose" "SurveyPurpose" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SurveyStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "type" "QuestionType" NOT NULL,
    "label" TEXT NOT NULL,
    "help_text" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" UUID NOT NULL,
    "survey_id" UUID NOT NULL,
    "survey_version" INTEGER NOT NULL,
    "subject_ref" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" UUID NOT NULL,
    "response_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "surveys_owner_ref_purpose_idx" ON "surveys"("owner_ref", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "survey_questions_survey_id_position_key" ON "survey_questions"("survey_id", "position");

-- CreateIndex
CREATE INDEX "survey_responses_survey_id_submitted_at_idx" ON "survey_responses"("survey_id", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_survey_id_subject_ref_key" ON "survey_responses"("survey_id", "subject_ref");

-- CreateIndex
CREATE UNIQUE INDEX "survey_answers_response_id_question_id_key" ON "survey_answers"("response_id", "question_id");

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
