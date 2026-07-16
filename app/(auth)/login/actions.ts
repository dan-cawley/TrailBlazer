"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { createClient } from "@/lib/supabase/server";

function loginUrl(message: string): Route {
  return `/login?message=${encodeURIComponent(message)}` as Route;
}

function credentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(formData: FormData) {
  const { email, password } = credentials(formData);

  if (!email || !password) redirect(loginUrl("Enter your email address and password."));

  let errorMessage: string | undefined;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    errorMessage = error?.message;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "We could not sign you in. Please try again.";
  }

  if (errorMessage) redirect(loginUrl(errorMessage));
  redirect("/onboarding/school-year");
}

export async function signUp(formData: FormData) {
  const { email, password } = credentials(formData);

  if (!email || !password) redirect(loginUrl("Enter an email address and password to create an account."));
  if (password.length < 8) redirect(loginUrl("Use a password with at least 8 characters."));

  let errorMessage: string | undefined;
  try {
    const supabase = await createClient();
    const origin = (await headers()).get("origin") ?? "http://localhost:3000";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    errorMessage = error?.message;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "We could not create your account. Please try again.";
  }

  if (errorMessage) redirect(loginUrl(errorMessage));
  redirect(loginUrl("Check your email to confirm your account, then sign in."));
}
