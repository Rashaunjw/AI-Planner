-- CreateTable
CREATE TABLE "UserClassColor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserClassColor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserClassColor_userId_className_key" ON "UserClassColor"("userId", "className");

-- CreateIndex
CREATE INDEX "UserClassColor_userId_idx" ON "UserClassColor"("userId");

-- AddForeignKey
ALTER TABLE "UserClassColor" ADD CONSTRAINT "UserClassColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
