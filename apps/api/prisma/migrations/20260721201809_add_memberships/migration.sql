-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('draft', 'active', 'paused');

-- CreateEnum
CREATE TYPE "AccrualMode" AS ENUM ('visits', 'points', 'both');

-- CreateEnum
CREATE TYPE "TierMetric" AS ENUM ('visits', 'points');

-- CreateEnum
CREATE TYPE "TierPeriod" AS ENUM ('lifetime', 'rolling');

-- CreateEnum
CREATE TYPE "DowngradePolicy" AS ENUM ('never', 'on_period_exit');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'cancelled');

-- CreateEnum
CREATE TYPE "LedgerKind" AS ENUM ('accrual', 'redemption', 'expiry', 'adjustment');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('issued', 'redeemed', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "membership_programs" (
    "id" UUID NOT NULL,
    "owner_ref" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProgramStatus" NOT NULL DEFAULT 'draft',
    "accrual_mode" "AccrualMode" NOT NULL DEFAULT 'visits',
    "points_per_visit" INTEGER NOT NULL DEFAULT 10,
    "tier_metric" "TierMetric" NOT NULL DEFAULT 'visits',
    "tier_period" "TierPeriod" NOT NULL DEFAULT 'lifetime',
    "tier_window_days" INTEGER,
    "downgrade_policy" "DowngradePolicy" NOT NULL DEFAULT 'never',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_tiers" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "benefits" TEXT[],
    "position" INTEGER NOT NULL,

    CONSTRAINT "membership_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "held_tier_position" INTEGER,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_ledger_entries" (
    "id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "kind" "LedgerKind" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "source_ref" TEXT NOT NULL,
    "note" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_rewards" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost_points" INTEGER NOT NULL DEFAULT 0,
    "min_tier_position" INTEGER,
    "limit_per_member" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "membership_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_redemptions" (
    "id" UUID NOT NULL,
    "reward_id" UUID NOT NULL,
    "membership_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'issued',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "membership_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membership_programs_owner_ref_idx" ON "membership_programs"("owner_ref");

-- CreateIndex
CREATE UNIQUE INDEX "membership_tiers_program_id_position_key" ON "membership_tiers"("program_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_program_id_user_id_key" ON "memberships"("program_id", "user_id");

-- CreateIndex
CREATE INDEX "membership_ledger_entries_membership_id_occurred_at_idx" ON "membership_ledger_entries"("membership_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "membership_ledger_entries_membership_id_source_ref_key" ON "membership_ledger_entries"("membership_id", "source_ref");

-- CreateIndex
CREATE UNIQUE INDEX "membership_redemptions_code_key" ON "membership_redemptions"("code");

-- CreateIndex
CREATE INDEX "membership_redemptions_membership_id_idx" ON "membership_redemptions"("membership_id");

-- AddForeignKey
ALTER TABLE "membership_tiers" ADD CONSTRAINT "membership_tiers_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "membership_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "membership_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_ledger_entries" ADD CONSTRAINT "membership_ledger_entries_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_rewards" ADD CONSTRAINT "membership_rewards_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "membership_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_redemptions" ADD CONSTRAINT "membership_redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "membership_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_redemptions" ADD CONSTRAINT "membership_redemptions_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
