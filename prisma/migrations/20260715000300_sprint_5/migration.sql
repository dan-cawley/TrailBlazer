-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ROLLOVER', 'LOCKED_ITEM');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Unit" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScheduledAssignment" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "WeekLock" (
    "id" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeekLock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "rolloverEnabled" BOOLEAN NOT NULL DEFAULT true,
    "planningEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dedupeKey" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeekLock_schoolYearId_weekStart_key" ON "WeekLock"("schoolYearId", "weekStart");
CREATE INDEX "WeekLock_schoolYearId_idx" ON "WeekLock"("schoolYearId");
CREATE UNIQUE INDEX "NotificationPreference_ownerId_key" ON "NotificationPreference"("ownerId");
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_ownerId_dismissedAt_createdAt_idx" ON "Notification"("ownerId", "dismissedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "WeekLock" ADD CONSTRAINT "WeekLock_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
