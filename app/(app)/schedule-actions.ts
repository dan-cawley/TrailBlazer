"use server";

import { AssignmentStatus } from "@prisma/client";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function setAssignmentStatus(formData: FormData) {
  const scheduledAssignmentId = String(formData.get("scheduledAssignmentId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const value = String(formData.get("status") ?? "");
  const status = Object.values(AssignmentStatus).includes(value as AssignmentStatus)
    ? (value as AssignmentStatus)
    : null;
  if (!scheduledAssignmentId || !studentId || !status) redirect("/students");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const studentAccount = await prisma.studentAccount.findUnique({ where: { authUserId: user.id } });
  const scheduledAssignment = await prisma.scheduledAssignment.findFirst({
    where: studentAccount
      ? { id: scheduledAssignmentId, course: { studentId: studentAccount.studentId } }
      : { id: scheduledAssignmentId, course: { studentId, student: { schoolYear: { ownerId: user.id } } } },
    select: { id: true },
  });
  if (!scheduledAssignment) redirect("/students");

  await prisma.scheduledAssignment.update({
    where: { id: scheduledAssignmentId },
    data: { status, completedAt: status === AssignmentStatus.COMPLETED ? new Date() : null },
  });
  const destination = (studentAccount ? "/student" : `/students/${studentId}/today`) as Route;
  revalidatePath(destination);
  revalidatePath("/dashboard");
  redirect(destination);
}
