-- AlterTable
ALTER TABLE "users" ADD COLUMN "alipayOpenId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_alipayOpenId_key" ON "users"("alipayOpenId");
