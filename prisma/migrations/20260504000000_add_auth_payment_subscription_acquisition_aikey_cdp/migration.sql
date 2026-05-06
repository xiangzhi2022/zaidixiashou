-- CreateEnum
CREATE TYPE "LoginMethod" AS ENUM ('WECHAT', 'SMS', 'PASSWORD');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WECHAT_PAY', 'ALIPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "CdpSessionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "AcquisitionTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AcquisitionTaskType" AS ENUM ('KEYWORD_SEARCH', 'COMMENT_SCRAPE', 'FOLLOWER_SCRAPE', 'PROFILE_SCRAPE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'REPLIED', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "AiKeyProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AiKeyStatus" AS ENUM ('ACTIVE', 'TESTING', 'FAILED', 'DISABLED');

-- AlterEnum
ALTER TYPE "AuthType" ADD VALUE 'CDP';

-- AlterTable
ALTER TABLE "platform_accounts" ADD COLUMN     "cdpSessionId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "loginMethod" "LoginMethod" NOT NULL DEFAULT 'SMS',
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "wechatOpenId" TEXT,
ADD COLUMN     "wechatUnionId" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "cdp_sessions" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" "CdpSessionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "debugPort" INTEGER NOT NULL DEFAULT 9222,
    "chromeVersion" TEXT,
    "connectedAt" TIMESTAMP(3),
    "lastHeartbeat" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cdp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "aiQuotaDaily" INTEGER NOT NULL DEFAULT 100,
    "aiQuotaUsed" INTEGER NOT NULL DEFAULT 0,
    "cdpConcurrency" INTEGER NOT NULL DEFAULT 1,
    "acquisitionLimit" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "outTradeNo" TEXT NOT NULL,
    "transactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acquisition_tasks" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "taskType" "AcquisitionTaskType" NOT NULL,
    "keywords" TEXT[],
    "status" "AcquisitionTaskStatus" NOT NULL DEFAULT 'PENDING',
    "maxResults" INTEGER NOT NULL DEFAULT 100,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acquisition_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "username" TEXT NOT NULL,
    "profileUrl" TEXT,
    "interactionType" TEXT,
    "intentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "profileData" JSONB,
    "lastContactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_campaigns" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "leadIds" TEXT[],
    "status" "AcquisitionTaskStatus" NOT NULL DEFAULT 'PENDING',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "repliedCount" INTEGER NOT NULL DEFAULT 0,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "provider" "AiKeyProvider" NOT NULL,
    "endpoint" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "defaultModel" TEXT NOT NULL,
    "advancedModel" TEXT,
    "embeddingModel" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" "AiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cdp_sessions_teamId_key" ON "cdp_sessions"("teamId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_status_idx" ON "subscriptions"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_outTradeNo_key" ON "payments"("outTradeNo");

-- CreateIndex
CREATE INDEX "payments_userId_status_idx" ON "payments"("userId", "status");

-- CreateIndex
CREATE INDEX "payments_outTradeNo_idx" ON "payments"("outTradeNo");

-- CreateIndex
CREATE INDEX "acquisition_tasks_teamId_status_idx" ON "acquisition_tasks"("teamId", "status");

-- CreateIndex
CREATE INDEX "leads_teamId_status_idx" ON "leads"("teamId", "status");

-- CreateIndex
CREATE INDEX "leads_taskId_idx" ON "leads"("taskId");

-- CreateIndex
CREATE INDEX "outreach_campaigns_teamId_status_idx" ON "outreach_campaigns"("teamId", "status");

-- CreateIndex
CREATE INDEX "ai_keys_userId_provider_idx" ON "ai_keys"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_wechatOpenId_key" ON "users"("wechatOpenId");

-- AddForeignKey
ALTER TABLE "cdp_sessions" ADD CONSTRAINT "cdp_sessions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acquisition_tasks" ADD CONSTRAINT "acquisition_tasks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "acquisition_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_campaigns" ADD CONSTRAINT "outreach_campaigns_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_keys" ADD CONSTRAINT "ai_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

