-- CreateEnum
CREATE TYPE "CurriculumSource" AS ENUM ('TRAILBLAZER_LIBRARY', 'UPLOAD', 'MANUAL');
CREATE TYPE "AssignmentType" AS ENUM ('LESSON', 'READING', 'QUIZ', 'TEST', 'LAB', 'ESSAY', 'PROJECT', 'DISCUSSION');

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingDays" "SchoolDay"[] NOT NULL,
    "targetEndDate" DATE NOT NULL,
    "parentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Curriculum" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "source" "CurriculumSource" NOT NULL,
    "title" TEXT NOT NULL,
    "storagePath" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "parentNotes" TEXT,
    "position" INTEGER NOT NULL,
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AssignmentType" NOT NULL,
    "parentNotes" TEXT,
    "estimatedMins" INTEGER,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Student_schoolYearId_idx" ON "Student"("schoolYearId");
CREATE INDEX "Course_studentId_idx" ON "Course"("studentId");
CREATE UNIQUE INDEX "Curriculum_courseId_key" ON "Curriculum"("courseId");
CREATE UNIQUE INDEX "Unit_curriculumId_position_key" ON "Unit"("curriculumId", "position");
CREATE INDEX "Unit_curriculumId_idx" ON "Unit"("curriculumId");
CREATE UNIQUE INDEX "Assignment_unitId_position_key" ON "Assignment"("unitId", "position");
CREATE INDEX "Assignment_unitId_idx" ON "Assignment"("unitId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
