import { Award } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function GradesPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const items = user ? await prisma.scheduledAssignment.findMany({ where: { course: { student: { schoolYear: { ownerId: user.id } } }, grade: { isNot: null } }, include: { grade: true, course: { include: { student: true } } }, orderBy: { course: { student: { name: "asc" } } } }) : [];
  const groups = new Map<string, typeof items>(); items.forEach((item) => { const key = `${item.course.student.name} · ${item.course.title}`; groups.set(key, [...(groups.get(key) ?? []), item]); });
  return <main className="mx-auto w-full max-w-5xl px-4 py-10 pb-24 sm:px-6 sm:py-14"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Records</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Grades</h1><p className="mt-3 text-slate-600">Assignment scores recorded by the parent.</p><section className="mt-8 space-y-4">{[...groups.entries()].map(([label, records]) => { const scored = records.reduce((sum, item) => sum + Number(item.grade?.score ?? 0), 0); const possible = records.reduce((sum, item) => sum + Number(item.grade?.possiblePoints ?? 0), 0); const percent = possible ? Math.round((scored / possible) * 100) : 0; return <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-slate-950">{label}</h2><p className="mt-1 text-sm text-slate-600">{records.length} graded assignments</p></div><div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-950"><Award className="size-4" /><span className="font-bold">{percent}%</span></div></div></article>; })}{groups.size === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No grades have been recorded yet. Add them from a course plan.</p> : null}</section></main>;
}
