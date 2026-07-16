"use server";

import { AssignmentType, CurriculumSource, SchoolDay } from "@prisma/client";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { availableCourseDates, distributeAssignments } from "@/lib/scheduling";
import { createClient } from "@/lib/supabase/server";

const MAX_CURRICULUM_FILE_SIZE = 20 * 1024 * 1024;
const schoolDayValues = Object.values(SchoolDay);
const assignmentTypeValues = Object.values(AssignmentType);

function studentsUrl(error: string): Route {
  return `/students?error=${encodeURIComponent(error)}` as Route;
}

function studentUrl(studentId: string, error?: string): Route {
  const query = error ? `?error=${encodeURIComponent(error)}` : "";
  return `/students/${studentId}${query}` as Route;
}

function courseUrl(studentId: string, courseId: string, error?: string): Route {
  const query = error ? `?error=${encodeURIComponent(error)}` : "";
  return `/students/${studentId}/courses/${courseId}${query}` as Route;
}

function dateFromForm(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function selectedDays(formData: FormData) {
  return formData
    .getAll("meetingDays")
    .map(String)
    .filter((day): day is SchoolDay => schoolDayValues.includes(day as SchoolDay));
}

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function ownedStudent(studentId: string, ownerId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, schoolYear: { ownerId } },
    include: { schoolYear: true },
  });
}

export async function createStudent(formData: FormData) {
  const schoolYearId = String(formData.get("schoolYearId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  if (!schoolYearId || !name || !grade) redirect(studentsUrl("Enter a name and grade for the student."));

  const { user } = await currentUser();
  const schoolYear = await prisma.schoolYear.findFirst({ where: { id: schoolYearId, ownerId: user.id } });
  if (!schoolYear) redirect(studentsUrl("Choose a school year before adding a student."));

  const student = await prisma.student.create({ data: { schoolYearId, name, grade } });
  redirect(`/students/${student.id}` as Route);
}

export async function updateStudent(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  if (!studentId || !name || !grade) redirect(studentUrl(studentId, "A student needs a name and grade."));

  const { user } = await currentUser();
  const student = await ownedStudent(studentId, user.id);
  if (!student) redirect("/students");

  await prisma.student.update({ where: { id: studentId }, data: { name, grade } });
  revalidatePath("/students");
  redirect(studentUrl(studentId));
}

export async function createCourse(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const targetEndDate = dateFromForm(String(formData.get("targetEndDate") ?? ""));
  const parentNotes = String(formData.get("parentNotes") ?? "").trim() || null;
  const curriculumTitle = String(formData.get("curriculumTitle") ?? "").trim();
  const sourceValue = String(formData.get("curriculumSource") ?? "");
  const curriculumSource = Object.values(CurriculumSource).includes(sourceValue as CurriculumSource)
    ? (sourceValue as CurriculumSource)
    : null;
  const meetingDays = selectedDays(formData);

  if (!studentId || !subject || !title || !targetEndDate || !curriculumSource || !curriculumTitle) {
    redirect(studentUrl(studentId, "Complete the course and curriculum details."));
  }
  if (meetingDays.length === 0) redirect(studentUrl(studentId, "Choose at least one meeting day."));

  const { supabase, user } = await currentUser();
  const student = await ownedStudent(studentId, user.id);
  if (!student) redirect("/students");

  const fileEntry = formData.get("curriculumFile");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  if (curriculumSource === CurriculumSource.UPLOAD && !file) {
    redirect(studentUrl(studentId, "Choose a curriculum file to upload."));
  }
  if (file && file.size > MAX_CURRICULUM_FILE_SIZE) {
    redirect(studentUrl(studentId, "Curriculum files must be 20 MB or smaller."));
  }

  let uploadData:
    | { storagePath: string; fileName: string; mimeType: string | null; sizeBytes: number }
    | undefined;
  if (file) {
    const bucket = process.env.SUPABASE_CURRICULUM_BUCKET ?? "curriculum-files";
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
    const storagePath = `${user.id}/${crypto.randomUUID()}-${safeFileName || "curriculum"}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (uploadError) redirect(studentUrl(studentId, `Curriculum upload failed: ${uploadError.message}`));
    uploadData = {
      storagePath,
      fileName: file.name || "curriculum",
      mimeType: file.type || null,
      sizeBytes: file.size,
    };
  }

  const course = await prisma.course.create({
    data: {
      studentId,
      subject,
      title,
      meetingDays,
      targetEndDate,
      parentNotes,
      curriculum: {
        create: {
          source: curriculumSource,
          title: curriculumTitle,
          ...(uploadData ?? {}),
        },
      },
    },
  });

  redirect(courseUrl(studentId, course.id));
}

export async function addUnit(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const curriculumId = String(formData.get("curriculumId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const parentNotes = String(formData.get("parentNotes") ?? "").trim() || null;
  if (!title) redirect(courseUrl(studentId, courseId, "Give the unit a title."));

  const { user } = await currentUser();
  const curriculum = await prisma.curriculum.findFirst({
    where: { id: curriculumId, courseId, course: { studentId, student: { schoolYear: { ownerId: user.id } } } },
    select: { _count: { select: { units: true } } },
  });
  if (!curriculum) redirect("/students");

  await prisma.unit.create({
    data: { curriculumId, title, parentNotes, position: curriculum._count.units + 1 },
  });
  redirect(courseUrl(studentId, courseId));
}

export async function addAssignment(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const unitId = String(formData.get("unitId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const typeValue = String(formData.get("type") ?? "");
  const type = assignmentTypeValues.includes(typeValue as AssignmentType) ? (typeValue as AssignmentType) : null;
  const parentNotes = String(formData.get("parentNotes") ?? "").trim() || null;
  const estimatedValue = String(formData.get("estimatedMins") ?? "").trim();
  const estimatedMins = estimatedValue ? Number(estimatedValue) : null;
  const optional = formData.get("optional") === "on";

  if (!title || !type) redirect(courseUrl(studentId, courseId, "Enter an assignment title and type."));
  if (estimatedMins !== null && (!Number.isInteger(estimatedMins) || estimatedMins < 1 || estimatedMins > 1440)) {
    redirect(courseUrl(studentId, courseId, "Estimated time must be between 1 and 1,440 minutes."));
  }

  const { user } = await currentUser();
  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      curriculum: { courseId, course: { studentId, student: { schoolYear: { ownerId: user.id } } } },
    },
    select: { _count: { select: { assignments: true } } },
  });
  if (!unit) redirect("/students");

  await prisma.assignment.create({
    data: {
      unitId,
      title,
      type,
      parentNotes,
      estimatedMins,
      optional,
      position: unit._count.assignments + 1,
    },
  });
  redirect(courseUrl(studentId, courseId));
}

export async function generateCoursePlan(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const { user } = await currentUser();
  const course = await prisma.course.findFirst({
    where: { id: courseId, studentId, student: { schoolYear: { ownerId: user.id } } },
    include: {
      student: { include: { schoolYear: { include: { vacations: true } } } },
      curriculum: { include: { units: { orderBy: { position: "asc" }, include: { assignments: { orderBy: { position: "asc" } } } } } },
    },
  });
  if (!course || !course.curriculum) redirect("/students");
  if (course.curriculum.source !== CurriculumSource.MANUAL) {
    redirect(courseUrl(studentId, courseId, "Add a manual curriculum before generating a plan."));
  }

  const assignments = course.curriculum.units.flatMap((unit) => unit.assignments);
  if (assignments.length === 0) {
    redirect(courseUrl(studentId, courseId, "Add at least one assignment before generating a plan."));
  }

  const dates = availableCourseDates({
    schoolYearStart: course.student.schoolYear.startDate,
    schoolYearEnd: course.student.schoolYear.endDate,
    targetEnd: course.targetEndDate,
    schoolDays: course.student.schoolYear.schoolDays,
    meetingDays: course.meetingDays,
    vacations: course.student.schoolYear.vacations,
  });
  if (dates.length === 0) {
    redirect(courseUrl(studentId, courseId, "There are no eligible meeting days before this course's target end date."));
  }

  const schedule = distributeAssignments(assignments.map((assignment) => assignment.id), dates);
  await prisma.$transaction([
    prisma.scheduledAssignment.deleteMany({ where: { courseId } }),
    prisma.scheduledAssignment.createMany({
      data: schedule.map((item) => ({ ...item, courseId })),
    }),
  ]);

  revalidatePath(`/students/${studentId}/courses/${courseId}`);
  redirect(courseUrl(studentId, courseId));
}
