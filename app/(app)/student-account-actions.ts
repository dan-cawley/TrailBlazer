"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

function studentUrl(studentId: string, error?: string): Route {
  return `/students/${studentId}${error ? `?error=${encodeURIComponent(error)}` : ""}` as Route;
}

export async function createStudentInvite(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!studentId || !email) redirect(studentUrl(studentId, "Enter the student email address."));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolYear: { ownerId: user.id } } });
  if (!student) redirect("/students");
  const existing = await prisma.studentAccount.findUnique({ where: { studentId } });
  if (existing?.authUserId) redirect(studentUrl(studentId, "This student account has already been claimed."));

  await prisma.studentAccount.upsert({
    where: { studentId },
    create: { studentId, email, inviteToken: crypto.randomUUID() },
    update: { email, inviteToken: crypto.randomUUID() },
  });
  revalidatePath(studentUrl(studentId));
  redirect(studentUrl(studentId));
}
