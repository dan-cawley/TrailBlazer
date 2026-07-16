import Link from "next/link";
import { CalendarRange, ListTree } from "lucide-react";

import { addDays, formatDate, weekStart } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function YearPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const schoolYear = user ? await prisma.schoolYear.findFirst({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" } }) : null;
  const assignments = schoolYear ? await prisma.scheduledAssignment.findMany({ where: { course: { student: { schoolYearId: schoolYear.id } } }, orderBy: [{ scheduledDate: "asc" }, { position: "asc" }], include: { course: { include: { student: true } }, assignment: true } }) : [];
  const weeks = new Map<string, typeof assignments>();
  assignments.forEach((assignment) => { const key = weekStart(assignment.scheduledDate).toISOString(); weeks.set(key, [...(weeks.get(key) ?? []), assignment]); });

  return <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Year view</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Pacing guide</h1><p className="mt-3 text-slate-600">Fixed instructional weeks with dates and each course’s planned work.</p></div><div className="flex gap-2"><Link href="/schedule/week" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><CalendarRange className="size-4" />Week</Link><Link href="/schedule/month" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><CalendarRange className="size-4" />Month</Link></div></div>{!schoolYear ? <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">Set up a school year to generate a pacing guide.</p> : null}{schoolYear ? <section className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[44rem] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-600"><tr><th className="px-4 py-3">Week</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Courses</th></tr></thead><tbody>{[...weeks.entries()].map(([key, items], index) => { const start = new Date(key); const courseGroups = new Map<string, typeof assignments>(); items.forEach((item) => { const label = `${item.course.student.name} · ${item.course.title}`; courseGroups.set(label, [...(courseGroups.get(label) ?? []), item]); }); return <tr key={key} className="border-b border-slate-100 align-top"><td className="px-4 py-4 font-semibold text-slate-900">{index + 1}</td><td className="px-4 py-4 text-slate-600">{formatDate(start, { month: "short", day: "numeric" })} – {formatDate(addDays(start, 4), { month: "short", day: "numeric" })}</td><td className="px-4 py-4"><div className="space-y-2">{[...courseGroups.entries()].map(([course, courseItems]) => <div key={course}><span className="font-semibold text-slate-900">{course}</span><span className="ml-2 text-slate-600">{courseItems.map((item) => item.assignment.title).join(", ")}</span></div>)}</div></td></tr>; })}{weeks.size === 0 ? <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-600"><ListTree className="mx-auto mb-3 size-6 text-slate-400" />Generate a course plan to fill the pacing guide.</td></tr> : null}</tbody></table></section> : null}</main>;
}
