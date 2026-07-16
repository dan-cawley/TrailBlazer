"use server";

import { AssignmentStatus } from "@prisma/client";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { dateKey, todayUtc, utcDate, weekStart } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { availableCourseDates, distributeAssignments } from "@/lib/scheduling";
import { createClient } from "@/lib/supabase/server";

function courseUrl(studentId: string, courseId: string, error?: string): Route {
  const query = error ? `?error=${encodeURIComponent(error)}` : "";
  return `/students/${studentId}/courses/${courseId}${query}` as Route;
}

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

async function ownedCourse(courseId: string, studentId: string, ownerId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, studentId, student: { schoolYear: { ownerId } } },
    include: {
      student: { include: { schoolYear: { include: { vacations: true, weekLocks: true } } } },
      scheduledAssignments: { orderBy: [{ scheduledDate: "asc" }, { position: "asc" }], include: { assignment: { include: { unit: true } } } },
    },
  });
}

function isWeekLocked(weekLocks: { weekStart: Date }[], date: Date) {
  const week = dateKey(weekStart(date));
  return weekLocks.some((lock) => dateKey(lock.weekStart) === week);
}

async function respaceCourseItems({
  course,
  items,
  startAt,
  endAt,
}: {
  course: NonNullable<Awaited<ReturnType<typeof ownedCourse>>>;
  items: NonNullable<Awaited<ReturnType<typeof ownedCourse>>>["scheduledAssignments"];
  startAt: Date;
  endAt?: Date;
}) {
  const schoolYear = course.student.schoolYear;
  const dates = availableCourseDates({
    schoolYearStart: schoolYear.startDate,
    schoolYearEnd: endAt && endAt < schoolYear.endDate ? endAt : schoolYear.endDate,
    targetEnd: endAt && endAt < course.targetEndDate ? endAt : course.targetEndDate,
    startAt,
    schoolDays: schoolYear.schoolDays,
    meetingDays: course.meetingDays,
    vacations: schoolYear.vacations,
  });
  if (dates.length === 0) return false;
  const assignments = items.filter((item) => item.status === AssignmentStatus.NOT_STARTED && !item.isLocked && !item.assignment.unit.isLocked);
  if (assignments.length === 0) return true;
  const distributed = distributeAssignments(assignments.map((item) => item.assignmentId), dates);
  await prisma.$transaction(distributed.map((item) => prisma.scheduledAssignment.update({
    where: { courseId_assignmentId: { courseId: course.id, assignmentId: item.assignmentId } },
    data: { scheduledDate: item.scheduledDate },
  })));
  return true;
}

export async function toggleLock(formData: FormData) {
  const kind = String(formData.get("kind") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const entityId = String(formData.get("entityId") ?? "");
  const locked = formData.get("locked") === "true";
  const user = await currentUser();
  const course = await ownedCourse(courseId, studentId, user.id);
  if (!course) redirect("/students");

  if (kind === "COURSE") await prisma.course.update({ where: { id: courseId }, data: { isLocked: locked } });
  if (kind === "UNIT") {
    const unit = await prisma.unit.findFirst({ where: { id: entityId, curriculum: { courseId } } });
    if (unit) await prisma.unit.update({ where: { id: unit.id }, data: { isLocked: locked } });
  }
  if (kind === "ASSIGNMENT") {
    const item = course.scheduledAssignments.find((assignment) => assignment.id === entityId);
    if (item) await prisma.scheduledAssignment.update({ where: { id: item.id }, data: { isLocked: locked } });
  }
  if (kind === "WEEK") {
    const week = utcDate(String(formData.get("weekStart") ?? ""));
    if (week) {
      if (locked) await prisma.weekLock.upsert({ where: { schoolYearId_weekStart: { schoolYearId: course.student.schoolYearId, weekStart: week } }, create: { schoolYearId: course.student.schoolYearId, weekStart: week }, update: {} });
      else await prisma.weekLock.deleteMany({ where: { schoolYearId: course.student.schoolYearId, weekStart: week } });
    }
  }
  revalidatePath(courseUrl(studentId, courseId));
  redirect(courseUrl(studentId, courseId));
}

export async function toggleWeekLock(formData: FormData) {
  const schoolYearId = String(formData.get("schoolYearId") ?? "");
  const week = utcDate(String(formData.get("weekStart") ?? ""));
  const locked = formData.get("locked") === "true";
  const user = await currentUser();
  const schoolYear = await prisma.schoolYear.findFirst({ where: { id: schoolYearId, ownerId: user.id } });
  if (!schoolYear || !week) redirect("/schedule/week");
  if (locked) await prisma.weekLock.upsert({ where: { schoolYearId_weekStart: { schoolYearId, weekStart: week } }, create: { schoolYearId, weekStart: week }, update: {} });
  else await prisma.weekLock.deleteMany({ where: { schoolYearId, weekStart: week } });
  const destination = `/schedule/week?date=${dateKey(week)}` as Route;
  revalidatePath(destination);
  redirect(destination);
}

export async function applyScheduleAdjustment(formData: FormData) {
  const action = String(formData.get("action") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const scheduledAssignmentId = String(formData.get("scheduledAssignmentId") ?? "");
  const user = await currentUser();
  const course = await ownedCourse(courseId, studentId, user.id);
  if (!course) redirect("/students");
  if (course.isLocked) redirect(courseUrl(studentId, courseId, "This course is locked. Unlock it before adjusting its plan."));
  const selected = course.scheduledAssignments.find((item) => item.id === scheduledAssignmentId);
  if (!selected) redirect(courseUrl(studentId, courseId, "Choose an assignment to adjust."));
  if (selected.isLocked || selected.assignment.unit.isLocked || isWeekLocked(course.student.schoolYear.weekLocks, selected.scheduledDate)) {
    redirect(courseUrl(studentId, courseId, "That assignment is locked and cannot be adjusted."));
  }

  if (action === "DOUBLE_UP") {
    const targetDate = utcDate(String(formData.get("targetDate") ?? ""));
    if (!targetDate) redirect(courseUrl(studentId, courseId, "Choose a date for the double-up."));
    const eligible = availableCourseDates({ schoolYearStart: course.student.schoolYear.startDate, schoolYearEnd: course.student.schoolYear.endDate, targetEnd: course.targetEndDate, schoolDays: course.student.schoolYear.schoolDays, meetingDays: course.meetingDays, vacations: course.student.schoolYear.vacations });
    if (!eligible.some((date) => dateKey(date) === dateKey(targetDate))) redirect(courseUrl(studentId, courseId, "Choose an eligible meeting day that is not a vacation."));
    await prisma.scheduledAssignment.update({ where: { id: selected.id }, data: { scheduledDate: targetDate } });
  } else if (action === "WEEK") {
    const start = weekStart(selected.scheduledDate);
    const items = course.scheduledAssignments.filter((item) => item.scheduledDate >= start && item.scheduledDate <= new Date(start.getTime() + 6 * 86400000));
    if (!(await respaceCourseItems({ course, items, startAt: start, endAt: new Date(start.getTime() + 4 * 86400000) }))) redirect(courseUrl(studentId, courseId, "No available school days remain in this week."));
  } else if (action === "UNIT") {
    const items = course.scheduledAssignments.filter((item) => item.assignment.unitId === selected.assignment.unitId);
    if (!(await respaceCourseItems({ course, items, startAt: todayUtc() }))) redirect(courseUrl(studentId, courseId, "No eligible dates remain for this unit."));
  } else if (action === "COURSE") {
    if (!(await respaceCourseItems({ course, items: course.scheduledAssignments, startAt: todayUtc() }))) redirect(courseUrl(studentId, courseId, "No eligible dates remain for this course."));
  } else {
    redirect(courseUrl(studentId, courseId, "Choose a schedule adjustment."));
  }
  revalidatePath(courseUrl(studentId, courseId));
  revalidatePath("/dashboard");
  redirect(courseUrl(studentId, courseId));
}

export async function rebuildSchoolYear(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const user = await currentUser();
  const currentCourse = await ownedCourse(courseId, studentId, user.id);
  if (!currentCourse) redirect("/students");
  const courses = await prisma.course.findMany({
    where: { student: { schoolYearId: currentCourse.student.schoolYearId, schoolYear: { ownerId: user.id } } },
    include: {
      student: { include: { schoolYear: { include: { vacations: true, weekLocks: true } } } },
      scheduledAssignments: { orderBy: [{ scheduledDate: "asc" }, { position: "asc" }], include: { assignment: { include: { unit: true } } } },
    },
  });
  for (const course of courses) {
    if (course.isLocked) continue;
    await respaceCourseItems({ course, items: course.scheduledAssignments, startAt: todayUtc() });
  }
  revalidatePath("/dashboard");
  revalidatePath(courseUrl(studentId, courseId));
  redirect(courseUrl(studentId, courseId));
}

export async function dismissNotification(formData: FormData) {
  const notificationId = String(formData.get("notificationId") ?? "");
  const user = await currentUser();
  await prisma.notification.updateMany({ where: { id: notificationId, ownerId: user.id }, data: { dismissedAt: new Date() } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateNotificationPreferences(formData: FormData) {
  const user = await currentUser();
  await prisma.notificationPreference.upsert({
    where: { ownerId: user.id },
    create: { ownerId: user.id, rolloverEnabled: formData.get("rolloverEnabled") === "on", planningEnabled: formData.get("planningEnabled") === "on" },
    update: { rolloverEnabled: formData.get("rolloverEnabled") === "on", planningEnabled: formData.get("planningEnabled") === "on" },
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
