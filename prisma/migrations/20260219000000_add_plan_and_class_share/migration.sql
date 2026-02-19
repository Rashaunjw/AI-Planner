-- AlterTable
ALTER TABLE "User" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "ClassShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassShare_token_key" ON "ClassShare"("token");

-- CreateIndex
CREATE INDEX "ClassShare_token_idx" ON "ClassShare"("token");

-- CreateIndex
CREATE INDEX "ClassShare_userId_idx" ON "ClassShare"("userId");

-- AddForeignKey
ALTER TABLE "ClassShare" ADD CONSTRAINT "ClassShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
