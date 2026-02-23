-- CreateTable
CREATE TABLE "public"."StudyPlanPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "whenStudying" TEXT NOT NULL,
    "focusMinutes" TEXT NOT NULL,
    "startsBefore" TEXT NOT NULL,
    "commonObstacle" TEXT NOT NULL,
    "blockPreference" TEXT NOT NULL,
    "weeklyStudyHours" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyPlanPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudyPlanPreferences_userId_key" ON "public"."StudyPlanPreferences"("userId");

-- AddForeignKey
ALTER TABLE "public"."StudyPlanPreferences" ADD CONSTRAINT "StudyPlanPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
