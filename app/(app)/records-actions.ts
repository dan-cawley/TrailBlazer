"use server";

import { AttendanceStatus } from "@prisma/client";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { utcDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function parentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const studentAccount = await prisma.studentAccount.findUnique({ where: { authUserId: user.id } });
  if (studentAccount) redirect("/student");
  return user;
}

export async function recordAttendance(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const date = utcDate(String(formData.get("date") ?? ""));
  const statusValue = String(formData.get("status") ?? "");
  const status = Object.values(AttendanceStatus).includes(statusValue as AttendanceStatus) ? statusValue as AttendanceStatus : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!studentId || !date || !status) redirect("/attendance");
  const user = await parentUser();
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolYear: { ownerId: user.id } } });
  if (!student) redirect("/attendance");
  await prisma.attendanceRecord.upsert({ where: { studentId_date: { studentId, date } }, create: { studentId, date, status, notes }, update: { status, notes } });
  const destination = `/attendance?date=${date.toISOString().slice(0, 10)}` as Route;
  revalidatePath(destination);
  redirect(destination);
}

export async function recordGrade(formData: FormData) {
  const scheduledAssignmentId = String(formData.get("scheduledAssignmentId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const score = Number(formData.get("score"));
  const possiblePoints = Number(formData.get("possiblePoints"));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const destination = `/students/${studentId}/courses/${courseId}` as Route;
  if (!scheduledAssignmentId || !Number.isFinite(score) || !Number.isFinite(possiblePoints) || possiblePoints <= 0 || score < 0) redirect(destination);
  const user = await parentUser();
  const item = await prisma.scheduledAssignment.findFirst({ where: { id: scheduledAssignmentId, courseId, course: { studentId, student: { schoolYear: { ownerId: user.id } } } } });
  if (!item) redirect(destination);
  await prisma.gradeRecord.upsert({ where: { scheduledAssignmentId }, create: { scheduledAssignmentId, score, possiblePoints, notes }, update: { score, possiblePoints, notes, recordedAt: new Date() } });
  revalidatePath(destination);
  revalidatePath("/grades");
  redirect(destination);
}
