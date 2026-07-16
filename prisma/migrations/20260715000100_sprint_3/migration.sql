-- CreateTable
CREATE TABLE "ScheduledAssignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduledAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledAssignment_courseId_assignmentId_key" ON "ScheduledAssignment"("courseId", "assignmentId");
CREATE INDEX "ScheduledAssignment_courseId_scheduledDate_idx" ON "ScheduledAssignment"("courseId", "scheduledDate");
CREATE INDEX "ScheduledAssignment_assignmentId_idx" ON "ScheduledAssignment"("assignmentId");

-- AddForeignKey
ALTER TABLE "ScheduledAssignment" ADD CONSTRAINT "ScheduledAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledAssignment" ADD CONSTRAINT "ScheduledAssignment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
