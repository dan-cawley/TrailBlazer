import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { addDays, dateKey, formatDate, todayUtc, utcDate, weekStart } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { toggleWeekLock } from "@/app/(app)/planning-actions";
import { Button } from "@/components/ui/button";

export default async function WeekPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const [{ date }, supabase] = await Promise.all([searchParams, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const start = weekStart(utcDate(date ?? "") ?? todayUtc());
  const end = addDays(start, 4);
  const schoolYear = user ? await prisma.schoolYear.findFirst({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" }, include: { weekLocks: true } }) : null;
  const locked = schoolYear?.weekLocks.some((lock) => dateKey(lock.weekStart) === dateKey(start)) ?? false;
  const assignments = user ? await prisma.scheduledAssignment.findMany({ where: { course: { student: { schoolYear: { ownerId: user.id } } }, scheduledDate: { gte: start, lte: end } }, orderBy: [{ scheduledDate: "asc" }, { position: "asc" }], include: { course: { include: { student: true } }, assignment: true } }) : [];
  const days = Array.from({ length: 5 }, (_, index) => addDays(start, index));

  return <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Plan view</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Week</h1><p className="mt-2 text-slate-600">{formatDate(start, { month: "short", day: "numeric" })} – {formatDate(end, { month: "short", day: "numeric", year: "numeric" })}</p></div><div className="flex gap-2">{schoolYear ? <form action={toggleWeekLock}><input type="hidden" name="schoolYearId" value={schoolYear.id} /><input type="hidden" name="weekStart" value={dateKey(start)} /><input type="hidden" name="locked" value={String(!locked)} /><Button type="submit" variant="outline">{locked ? "Unlock week" : "Lock week"}</Button></form> : null}<Link href={`/schedule/week?date=${dateKey(addDays(start, -7))}`} className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"><ChevronLeft className="size-4" /></Link><Link href={`/schedule/week?date=${dateKey(addDays(start, 7))}`} className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"><ChevronRight className="size-4" /></Link></div></div>{locked ? <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">This week is locked. Automatic rollovers and schedule adjustments will preserve its assignments.</p> : null}<div className="mt-8 grid gap-4 lg:grid-cols-5">{days.map((day) => { const items = assignments.filter((item) => dateKey(item.scheduledDate) === dateKey(day)); return <section key={dateKey(day)} className="min-h-48 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">{formatDate(day, { weekday: "short" })}</p><h2 className="mt-1 text-lg font-semibold text-slate-950">{formatDate(day, { month: "short", day: "numeric" })}</h2><div className="mt-4 space-y-2">{items.map((item) => <Link key={item.id} href={`/students/${item.course.studentId}/courses/${item.courseId}`} className={`block rounded-lg p-3 text-sm ${item.status === "COMPLETED" ? "bg-slate-100 text-slate-500 line-through" : "bg-emerald-50 text-emerald-950"}`}><span className="block font-semibold">{item.assignment.title}</span><span className="mt-1 block text-xs opacity-75">{item.course.student.name} · {item.course.subject}</span></Link>)}{items.length === 0 ? <p className="text-sm text-slate-400">No work planned</p> : null}</div></section>; })}</div></main>;
}
