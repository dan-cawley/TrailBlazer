import Link from "next/link";
import { ArrowLeft, FileText, LibraryBig, PenLine } from "lucide-react";
import { notFound } from "next/navigation";

import { ManualCurriculumBuilder } from "@/components/manual-curriculum-builder";
import { generateCoursePlan } from "@/app/(app)/students/actions";
import { Button } from "@/components/ui/button";
import { LockButton } from "@/components/lock-button";
import { prisma } from "@/lib/prisma";
import { ScheduleAdjustmentForm } from "@/components/schedule-adjustment-form";
import { GradeForm } from "@/components/grade-form";
import { createClient } from "@/lib/supabase/server";

const sourcePresentation = {
  MANUAL: { label: "Manual curriculum", Icon: PenLine },
  UPLOAD: { label: "Uploaded curriculum", Icon: FileText },
  TRAILBLAZER_LIBRARY: { label: "TrailBlazer Library", Icon: LibraryBig },
} as const;

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string; courseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ studentId, courseId }, { error }, supabase] = await Promise.all([params, searchParams, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const course = user
    ? await prisma.course.findFirst({
        where: { id: courseId, studentId, student: { schoolYear: { ownerId: user.id } } },
        include: {
          student: true,
          curriculum: { include: { units: { orderBy: { position: "asc" }, include: { assignments: { orderBy: { position: "asc" } } } } } },
          scheduledAssignments: { orderBy: [{ scheduledDate: "asc" }, { position: "asc" }], include: { assignment: { include: { unit: true } }, grade: true } },
        },
      })
    : null;
  if (!course || !course.curriculum) notFound();

  const presentation = sourcePresentation[course.curriculum.source];
  const SourceIcon = presentation.Icon;
  const meetingDays = course.meetingDays.map((day) => day.charAt(0) + day.slice(1).toLowerCase()).join(", ");
  const completedCount = course.scheduledAssignments.filter((item) => item.status === "COMPLETED").length;
  const currentAssignment = course.scheduledAssignments.find((item) => item.status !== "COMPLETED");
  const nextAssignment = currentAssignment
    ? course.scheduledAssignments.find((item) => item.position > currentAssignment.position && item.status !== "COMPLETED")
    : undefined;
  const progress = course.scheduledAssignments.length
    ? Math.round((completedCount / course.scheduledAssignments.length) * 100)
    : 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href={`/students/${studentId}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-900"><ArrowLeft className="size-4" />{course.student.name}</Link>
      <div className="mt-5 mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">{course.subject}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{course.title}</h1>
        <p className="mt-3 text-sm text-slate-600">Meets {meetingDays.toLowerCase()} · Target end {course.targetEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</p>
        {course.parentNotes ? <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{course.parentNotes}</p> : null}
        </div>
        <LockButton kind="COURSE" studentId={studentId} courseId={courseId} locked={course.isLocked} />
      </div>
      {error ? <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">{error}</p> : null}
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-800"><SourceIcon className="size-4" /></span><div><p className="text-sm font-semibold text-slate-950">{presentation.label}</p><p className="mt-1 text-sm text-slate-600">{course.curriculum.title}</p>{course.curriculum.fileName ? <p className="mt-2 text-xs text-slate-500">Stored file: {course.curriculum.fileName}</p> : null}</div></div>
      </section>
      {course.scheduledAssignments.length > 0 ? (
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-600">Progress</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{progress}%</p><p className="mt-1 text-sm text-slate-600">{completedCount} of {course.scheduledAssignments.length} completed</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-600">Current assignment</p><p className="mt-2 font-semibold text-slate-950">{currentAssignment?.assignment.title ?? "Course complete"}</p><p className="mt-1 text-sm text-slate-600">{currentAssignment ? currentAssignment.scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "All planned work is done"}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-600">Next assignment</p><p className="mt-2 font-semibold text-slate-950">{nextAssignment?.assignment.title ?? "—"}</p><p className="mt-1 text-sm text-slate-600">{nextAssignment ? nextAssignment.scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : "No later work planned"}</p></div>
        </section>
      ) : null}
      {course.curriculum.source === "MANUAL" ? (
        <section className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Generate year plan</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">TrailBlazer spaces this course’s assignments across its meeting days, school-year breaks, and target end date.</p>
            </div>
            <form action={generateCoursePlan}>
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="courseId" value={courseId} />
              <Button type="submit">{course.scheduledAssignments.length ? "Regenerate plan" : "Generate year"}</Button>
            </form>
          </div>
          {course.scheduledAssignments.length > 0 ? (
            <div className="mt-5 border-t border-emerald-200 pt-5">
              <p className="text-sm font-semibold text-emerald-950">{course.scheduledAssignments.length} assignments planned across {new Set(course.scheduledAssignments.map((item) => item.scheduledDate.toISOString().slice(0, 10))).size} school days</p>
              <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                {course.scheduledAssignments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                    <div><span className="font-medium text-slate-900">{item.assignment.title}</span><span className="ml-2 text-slate-500">{item.assignment.unit.title}</span><GradeForm scheduledAssignmentId={item.id} studentId={studentId} courseId={courseId} grade={item.grade} /></div>
                    <div className="flex items-center gap-2"><time className="shrink-0 text-slate-600" dateTime={item.scheduledDate.toISOString()}>{item.scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time><LockButton kind="ASSIGNMENT" studentId={studentId} courseId={courseId} entityId={item.id} locked={item.isLocked} /></div>
                  </div>
                ))}
              </div>
              <ScheduleAdjustmentForm studentId={studentId} courseId={courseId} items={course.scheduledAssignments} />
            </div>
          ) : null}
        </section>
      ) : null}
      {course.curriculum.source === "MANUAL" ? (
        <ManualCurriculumBuilder studentId={studentId} courseId={course.id} curriculumId={course.curriculum.id} units={course.curriculum.units} />
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-600">This curriculum is on file. Import parsing and assignment generation are intentionally deferred to the scheduling work.</section>
      )}
    </main>
  );
}
