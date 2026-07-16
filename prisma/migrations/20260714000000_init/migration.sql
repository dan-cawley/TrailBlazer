-- CreateEnum
CREATE TYPE "SchoolDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');
CREATE TYPE "CalendarSource" AS ENUM ('TRAILBLAZER_DEFAULTS', 'DISTRICT_UPLOAD');
CREATE TYPE "VacationKind" AS ENUM ('THANKSGIVING', 'CHRISTMAS', 'SPRING_BREAK', 'CUSTOM');

-- CreateTable
CREATE TABLE "SchoolYear" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "schoolDays" "SchoolDay"[] NOT NULL,
    "calendarSource" "CalendarSource" NOT NULL DEFAULT 'TRAILBLAZER_DEFAULTS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchoolYear_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vacation" (
    "id" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "kind" "VacationKind" NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" DATE,
    "endDate" DATE,
    CONSTRAINT "Vacation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarUpload" (
    "id" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarUpload_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchoolYear_ownerId_label_key" ON "SchoolYear"("ownerId", "label");
CREATE INDEX "SchoolYear_ownerId_idx" ON "SchoolYear"("ownerId");
CREATE INDEX "Vacation_schoolYearId_idx" ON "Vacation"("schoolYearId");
CREATE UNIQUE INDEX "CalendarUpload_schoolYearId_key" ON "CalendarUpload"("schoolYearId");
ALTER TABLE "Vacation" ADD CONSTRAINT "Vacation_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarUpload" ADD CONSTRAINT "CalendarUpload_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
