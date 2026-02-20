-- CreateTable
CREATE TABLE "DigestSent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigestSent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DigestSent_userId_weekStart_key" ON "DigestSent"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "DigestSent_userId_idx" ON "DigestSent"("userId");

-- AddForeignKey
ALTER TABLE "DigestSent" ADD CONSTRAINT "DigestSent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
