import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { addDays, dateKey, formatDate, monthEnd, monthStart, todayUtc, utcDate, weekStart } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function MonthPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const [{ date }, supabase] = await Promise.all([searchParams, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const anchor = utcDate(date ?? "") ?? todayUtc();
  const start = monthStart(anchor);
  const end = monthEnd(anchor);
  const gridStart = weekStart(start);
  const gridEnd = addDays(weekStart(end), 6);
  const assignments = user ? await prisma.scheduledAssignment.findMany({ where: { course: { student: { schoolYear: { ownerId: user.id } } }, scheduledDate: { gte: gridStart, lte: gridEnd } }, orderBy: [{ scheduledDate: "asc" }, { position: "asc" }], include: { course: { include: { student: true } }, assignment: true } }) : [];
  const days = Array.from({ length: Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1 }, (_, index) => addDays(gridStart, index));
  const previousMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));
  const nextMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));

  return <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Plan view</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{formatDate(start, { month: "long", year: "numeric" })}</h1></div><div className="flex gap-2"><Link href={`/schedule/month?date=${dateKey(previousMonth)}`} className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"><ChevronLeft className="size-4" /></Link><Link href={`/schedule/month?date=${dateKey(nextMonth)}`} className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"><ChevronRight className="size-4" /></Link></div></div><div className="mt-8 overflow-x-auto"><div className="min-w-[52rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => <div key={label} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">{label}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => { const items = assignments.filter((item) => dateKey(item.scheduledDate) === dateKey(day)); const outside = day.getUTCMonth() !== start.getUTCMonth(); return <div key={dateKey(day)} className={`min-h-36 border-b border-r border-slate-100 p-2 ${outside ? "bg-slate-50/60 text-slate-400" : ""}`}><time className="text-sm font-semibold">{day.getUTCDate()}</time><div className="mt-2 space-y-1">{items.map((item) => <Link key={item.id} href={`/students/${item.course.studentId}/courses/${item.courseId}`} className={`block rounded px-2 py-1 text-xs ${item.status === "COMPLETED" ? "bg-slate-100 text-slate-400 line-through" : "bg-emerald-50 text-emerald-950"}`}><span className="font-semibold">{item.assignment.title}</span><span className="ml-1 opacity-70">{item.course.student.name}</span></Link>)}</div></div>; })}</div></div></div></main>;
}
