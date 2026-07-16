import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sun } from "lucide-react";
import { notFound } from "next/navigation";

import { AssignmentStatusControls } from "@/components/assignment-status-controls";
import { addDays, dateKey, formatDate, todayUtc } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function StudentTodayPage({ params }: { params: Promise<{ studentId: string }> }) {
  const [{ studentId }, supabase] = await Promise.all([params, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const student = user ? await prisma.student.findFirst({ where: { id: studentId, schoolYear: { ownerId: user.id } } }) : null;
  if (!student) notFound();
  const today = todayUtc();
  const tomorrow = addDays(today, 1);
  const assignments = await prisma.scheduledAssignment.findMany({
    where: { course: { studentId }, scheduledDate: { gte: today, lte: tomorrow } },
    orderBy: [{ scheduledDate: "asc" }, { position: "asc" }],
    include: { course: true, assignment: { include: { unit: true } } },
  });
  const todayAssignments = assignments.filter((item) => dateKey(item.scheduledDate) === dateKey(today));
  const tomorrowAssignments = assignments.filter((item) => dateKey(item.scheduledDate) === dateKey(tomorrow));
  const finished = todayAssignments.length === 0 || todayAssignments.every((item) => item.status === "COMPLETED");

  return <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14"><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-900"><ArrowLeft className="size-4" />Parent dashboard</Link><div className="mt-5"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">{formatDate(today, { weekday: "long", month: "long", day: "numeric" })}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{student.name}{"'s day"}</h1></div>
    <section className="mt-8 space-y-3">{todayAssignments.map((item) => <article key={item.id} className={`flex flex-col gap-4 rounded-xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${item.status === "COMPLETED" ? "border-slate-200 bg-slate-50 opacity-60" : "border-slate-200 bg-white"}`}><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">{item.course.subject} · {item.assignment.type.toLowerCase()}</p><h2 className="mt-1 text-lg font-semibold text-slate-950">{item.assignment.title}</h2><p className="mt-1 text-sm text-slate-600">{item.assignment.unit.title}{item.assignment.estimatedMins ? ` · about ${item.assignment.estimatedMins} min` : ""}</p></div><AssignmentStatusControls scheduledAssignmentId={item.id} studentId={studentId} status={item.status} /></article>)}{todayAssignments.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No assignments are planned for today.</p> : null}</section>
    {finished ? <section className="mt-6 rounded-xl bg-emerald-100 p-5 text-emerald-950"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5" />You&apos;re finished for today!</div><p className="mt-1 text-sm text-emerald-900">Great work. Take a look at tomorrow whenever you are ready.</p></section> : null}
    <section className="mt-10"><div className="flex items-center gap-2"><Sun className="size-5 text-emerald-800" /><h2 className="text-xl font-semibold text-slate-950">Tomorrow preview</h2></div><div className="mt-4 space-y-2">{tomorrowAssignments.map((item) => <div key={item.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"><span className="font-semibold text-slate-900">{item.assignment.title}</span><span className="ml-2 text-slate-500">{item.course.subject}</span></div>)}{tomorrowAssignments.length === 0 ? <p className="text-sm text-slate-600">Nothing is planned for tomorrow yet.</p> : null}</div></section>
  </main>;
}
