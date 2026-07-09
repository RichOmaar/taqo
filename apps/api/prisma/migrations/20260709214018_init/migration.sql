-- CreateEnum
CREATE TYPE "RestaurantPlan" AS ENUM ('free', 'paid');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('waiting', 'notified', 'seated', 'no_show', 'cancelled');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('admin', 'hostess');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('web_push', 'sms', 'whatsapp');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('registered', 'turn_near', 'table_ready');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('sent', 'failed');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "qr_token" TEXT NOT NULL,
    "eta_base_minutes" INTEGER NOT NULL,
    "expiration_minutes" INTEGER NOT NULL,
    "plan" "RestaurantPlan" NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queues" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" UUID NOT NULL,
    "queue_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "user_id" UUID,
    "display_name" TEXT NOT NULL,
    "party_size" INTEGER NOT NULL,
    "phone" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'waiting',
    "position" INTEGER NOT NULL,
    "eta_minutes" INTEGER,
    "eta_is_manual" BOOLEAN NOT NULL DEFAULT false,
    "form_data" JSONB NOT NULL DEFAULT '{}',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_at" TIMESTAMP(3),
    "seated_at" TIMESTAMP(3),

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_users" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "event_type" "NotificationEventType" NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_reviews" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_code_key" ON "restaurants"("code");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_qr_token_key" ON "restaurants"("qr_token");

-- CreateIndex
CREATE INDEX "queues_restaurant_id_idx" ON "queues"("restaurant_id");

-- CreateIndex
CREATE INDEX "waitlist_entries_queue_id_status_idx" ON "waitlist_entries"("queue_id", "status");

-- CreateIndex
CREATE INDEX "waitlist_entries_restaurant_id_idx" ON "waitlist_entries"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");

-- CreateIndex
CREATE INDEX "staff_users_restaurant_id_idx" ON "staff_users"("restaurant_id");

-- CreateIndex
CREATE INDEX "notifications_entry_id_idx" ON "notifications"("entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_reviews_entry_id_key" ON "service_reviews"("entry_id");

-- AddForeignKey
ALTER TABLE "queues" ADD CONSTRAINT "queues_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "queues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "waitlist_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "waitlist_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
