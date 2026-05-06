-- CreateTable
CREATE TABLE "ai_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiMode" TEXT NOT NULL DEFAULT 'platform',
    "defaultKeyRef" TEXT,
    "defaultModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "advancedModel" TEXT NOT NULL DEFAULT 'gpt-4o',
    "embeddingModel" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "maxConcurrency" INTEGER NOT NULL DEFAULT 5,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_configs_userId_key" ON "ai_configs"("userId");

-- AddForeignKey
ALTER TABLE "ai_configs" ADD CONSTRAINT "ai_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

