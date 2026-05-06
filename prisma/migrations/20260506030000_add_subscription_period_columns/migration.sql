-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "subscriptions" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);
