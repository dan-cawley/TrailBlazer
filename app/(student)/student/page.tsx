import { CheckCircle2, Compass, Sun } from "lucide-react";

import { signOut } from "@/app/(app)/actions";
import { AssignmentStatusControls } from "@/components/assignment-status-controls";
import { Button } from "@/components/ui/button";
import { addDays, dateKey, formatDate, todayUtc } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const account = user ? await prisma.studentAccount.findUnique({ where: { authUserId: user.id }, include: { student: true } }) : null;
  if (!account) return null;
  const today = todayUtc(); const tomorrow = addDays(today, 1);
  const assignments = await prisma.scheduledAssignment.findMany({ where: { course: { studentId: account.studentId }, scheduledDate: { gte: today, lte: tomorrow } }, orderBy: [{ scheduledDate: "asc" }, { position: "asc" }], include: { course: true, assignment: { include: { unit: true } } } });
  const todays = assignments.filter((item) => dateKey(item.scheduledDate) === dateKey(today));
  const tomorrows = assignments.filter((item) => dateKey(item.scheduledDate) === dateKey(tomorrow));
  const finished = todays.length === 0 || todays.every((item) => item.status === "COMPLETED");
  return <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-14"><header className="flex items-center gap-2 text-emerald-950"><span className="grid size-9 place-items-center rounded-lg bg-emerald-700 text-white"><Compass className="size-5" /></span><span className="text-xl font-bold">TrailBlazer</span></header><p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">{formatDate(today, { weekday: "long", month: "long", day: "numeric" })}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Hi, {account.student.name}</h1><section className="mt-8 space-y-3">{todays.map((item) => <article key={item.id} className={`rounded-xl border p-5 shadow-sm ${item.status === "COMPLETED" ? "border-slate-200 bg-slate-100 opacity-60" : "border-slate-200 bg-white"}`}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">{item.course.subject}</p><div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold text-slate-950">{item.assignment.title}</h2><p className="mt-1 text-sm text-slate-600">{item.assignment.unit.title}</p></div><AssignmentStatusControls scheduledAssignmentId={item.id} studentId={account.studentId} status={item.status} /></div></article>)}{todays.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No assignments are planned for today.</p> : null}</section>{finished ? <section className="mt-6 rounded-xl bg-emerald-100 p-5 text-emerald-950"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5" />You&apos;re finished for today!</div></section> : null}<section className="mt-10"><div className="flex items-center gap-2"><Sun className="size-5 text-emerald-800" /><h2 className="text-xl font-semibold text-slate-950">Tomorrow preview</h2></div><div className="mt-4 space-y-2">{tomorrows.map((item) => <div key={item.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"><span className="font-semibold text-slate-900">{item.assignment.title}</span><span className="ml-2 text-slate-500">{item.course.subject}</span></div>)}{tomorrows.length === 0 ? <p className="text-sm text-slate-600">Nothing is planned for tomorrow.</p> : null}</div></section><form action={signOut} className="mt-10"><Button type="submit" variant="ghost">Sign out</Button></form></main>;
}
