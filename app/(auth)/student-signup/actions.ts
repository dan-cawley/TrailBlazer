"use server";

import { headers } from "next/headers";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

function signupUrl(token: string, message: string): Route {
  return `/student-signup?token=${encodeURIComponent(token)}&message=${encodeURIComponent(message)}` as Route;
}

export async function claimStudentAccount(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const account = await prisma.studentAccount.findUnique({ where: { inviteToken: token } });
  if (!account || account.authUserId) redirect(signupUrl(token, "This invitation is no longer available."));
  if (account.email !== email) redirect(signupUrl(token, "Use the email address on the invitation."));
  if (password.length < 8) redirect(signupUrl(token, "Use a password with at least 8 characters."));

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/student` },
  });
  if (error || !data.user) redirect(signupUrl(token, error?.message ?? "We could not create the student account."));
  await prisma.studentAccount.update({ where: { id: account.id }, data: { authUserId: data.user.id, claimedAt: new Date() } });
  redirect("/login?message=Check%20your%20email%20to%20confirm%20the%20student%20account.");
}
