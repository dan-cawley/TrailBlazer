import { notFound } from "next/navigation";

import { claimStudentAccount } from "@/app/(auth)/student-signup/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";

export default async function StudentSignupPage({ searchParams }: { searchParams: Promise<{ token?: string; message?: string }> }) {
  const { token, message } = await searchParams;
  if (!token) notFound();
  const account = await prisma.studentAccount.findUnique({ where: { inviteToken: token }, include: { student: true } });
  if (!account || account.authUserId) notFound();
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-emerald-950/5 sm:p-9"><Logo /><h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-950">Create {account.student.name}&apos;s account</h1><p className="mt-2 text-sm leading-6 text-slate-600">This account only shows {account.student.name}&apos;s assignments and progress.</p>{message ? <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{message}</p> : null}<form action={claimStudentAccount} className="mt-6 space-y-4"><input type="hidden" name="token" value={token} /><div className="space-y-2"><Label htmlFor="student-email">Email</Label><Input id="student-email" name="email" type="email" defaultValue={account.email} required /></div><div className="space-y-2"><Label htmlFor="student-password">Password</Label><Input id="student-password" name="password" type="password" minLength={8} required /></div><Button type="submit" className="w-full">Create student account</Button></form></section></main>;
}
