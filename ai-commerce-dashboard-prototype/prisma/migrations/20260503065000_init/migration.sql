-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('AMAZON', 'EBAY', 'SHOPIFY', 'TIKTOK_SHOP', 'XIAOHONGSHU', 'DOUYIN', 'TIKTOK', 'INSTAGRAM', 'X_TWITTER', 'MERCADOLIBRE');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('OAUTH', 'API_KEY', 'COOKIE', 'MCP_STDIO', 'OPENAPI');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('CONNECTED', 'PENDING_AUTH', 'NEEDS_LOGIN', 'EXPIRED', 'FAILED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('QUEUED', 'RUNNING', 'WAITING_APPROVAL', 'SUCCEEDED', 'FAILED', 'CANCELED', 'RETRYING');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SCHEDULED', 'PUBLISHED', 'PUBLISH_FAILED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGE_REQUESTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AiPlanStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED', 'EXECUTING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AutopilotLevel" AS ENUM ('OFF', 'DRAFT_ONLY', 'SEMI_AUTO', 'HIGH_AUTO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "autopilotLevel" "AutopilotLevel" NOT NULL DEFAULT 'DRAFT_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_accounts" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING_AUTH',
    "authType" "AuthType" NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_credentials" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_actions" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "status" "ActionStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT NOT NULL,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "platform_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_runs" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "connectorName" TEXT NOT NULL,
    "requestPayloadSnapshot" JSONB NOT NULL,
    "responseSnapshot" JSONB,
    "status" "ActionStatus" NOT NULL DEFAULT 'QUEUED',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "connector_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_rules" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "actionType" TEXT NOT NULL,
    "platform" "Platform",
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_drafts" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "scheduledAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_versions" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'HIGH',
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reason" TEXT NOT NULL,
    "payloadSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_plans" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "AiPlanStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_plan_steps" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "ai_plan_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");

-- CreateIndex
CREATE INDEX "platform_accounts_teamId_platform_status_idx" ON "platform_accounts"("teamId", "platform", "status");

-- CreateIndex
CREATE UNIQUE INDEX "platform_accounts_teamId_platform_displayName_key" ON "platform_accounts"("teamId", "platform", "displayName");

-- CreateIndex
CREATE UNIQUE INDEX "platform_credentials_accountId_key" ON "platform_credentials"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_actions_idempotencyKey_key" ON "platform_actions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "platform_actions_teamId_status_idx" ON "platform_actions"("teamId", "status");

-- CreateIndex
CREATE INDEX "platform_actions_accountId_actionType_idx" ON "platform_actions"("accountId", "actionType");

-- CreateIndex
CREATE INDEX "connector_runs_actionId_status_idx" ON "connector_runs"("actionId", "status");

-- CreateIndex
CREATE INDEX "risk_rules_teamId_actionType_platform_idx" ON "risk_rules"("teamId", "actionType", "platform");

-- CreateIndex
CREATE INDEX "media_drafts_teamId_status_idx" ON "media_drafts"("teamId", "status");

-- CreateIndex
CREATE INDEX "media_drafts_platform_scheduledAt_idx" ON "media_drafts"("platform", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "draft_versions_draftId_version_key" ON "draft_versions"("draftId", "version");

-- CreateIndex
CREATE INDEX "approval_requests_teamId_status_idx" ON "approval_requests"("teamId", "status");

-- CreateIndex
CREATE INDEX "audit_logs_teamId_actionType_createdAt_idx" ON "audit_logs"("teamId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "ai_plans_teamId_status_idx" ON "ai_plans"("teamId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_plan_steps_planId_stepOrder_key" ON "ai_plan_steps"("planId", "stepOrder");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_accounts" ADD CONSTRAINT "platform_accounts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_credentials" ADD CONSTRAINT "platform_credentials_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "platform_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_actions" ADD CONSTRAINT "platform_actions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_actions" ADD CONSTRAINT "platform_actions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "platform_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_runs" ADD CONSTRAINT "connector_runs_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "platform_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_rules" ADD CONSTRAINT "risk_rules_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_drafts" ADD CONSTRAINT "media_drafts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_versions" ADD CONSTRAINT "draft_versions_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "media_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_plans" ADD CONSTRAINT "ai_plans_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_plan_steps" ADD CONSTRAINT "ai_plan_steps_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ai_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

