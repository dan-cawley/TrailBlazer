-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('NOT_STARTED', 'PARTIALLY_COMPLETED', 'COMPLETED');

-- AlterTable
ALTER TABLE "ScheduledAssignment"
ADD COLUMN "status" "AssignmentStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "completedAt" TIMESTAMP(3);
