-- Add new column and migrate data: reminderDays (days) -> reminderMinutesBefore (minutes)
-- 2 days = 2880 min, 1 day = 1440 min, etc.
ALTER TABLE "User" ADD COLUMN "reminderMinutesBefore" INTEGER NOT NULL DEFAULT 2880;

UPDATE "User" SET "reminderMinutesBefore" = "reminderDays" * 1440 WHERE "reminderDays" IS NOT NULL;

ALTER TABLE "User" DROP COLUMN "reminderDays";
