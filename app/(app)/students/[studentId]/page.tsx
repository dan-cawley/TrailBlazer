import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";

import { CourseForm } from "@/components/course-form";
import { updateStudent } from "@/app/(app)/students/actions";
import { createStudentInvite } from "@/app/(app)/student-account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function StudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ studentId }, { error }, supabase] = await Promise.all([params, searchParams, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const student = user
    ? await prisma.student.findFirst({
        where: { id: studentId, schoolYear: { ownerId: user.id } },
        include: { schoolYear: true, studentAccount: true, courses: { orderBy: { createdAt: "asc" }, include: { curriculum: true } } },
      })
    : null;
  if (!student) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/students" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-900"><ArrowLeft className="size-4" />All students</Link>
      <div className="mt-5 mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">{student.grade} grade · {student.schoolYear.label}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{student.name}</h1>
      </div>
      {error ? <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">{error}</p> : null}

      <details className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-emerald-900">Edit student</summary>
        <form action={updateStudent} className="mt-5 grid gap-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
          <input type="hidden" name="studentId" value={student.id} />
          <div className="space-y-2"><Label htmlFor="edit-student-name">Name</Label><Input id="edit-student-name" name="name" defaultValue={student.name} required /></div>
          <div className="space-y-2"><Label htmlFor="edit-student-grade">Grade</Label><Input id="edit-student-grade" name="grade" defaultValue={student.grade} required /></div>
          <Button type="submit" variant="outline">Save changes</Button>
        </form>
      </details>
      <details className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-emerald-900">Student account</summary>
        {student.studentAccount?.authUserId ? <p className="mt-4 text-sm text-slate-600">This student account is active for {student.studentAccount.email}.</p> : <form action={createStudentInvite} className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><input type="hidden" name="studentId" value={student.id} /><div className="space-y-2"><Label htmlFor="student-account-email">Student email</Label><Input id="student-account-email" name="email" type="email" defaultValue={student.studentAccount?.email} required /></div><Button type="submit" variant="outline">Create invite</Button></form>}
        {student.studentAccount && !student.studentAccount.authUserId ? <div className="mt-4 rounded-lg bg-emerald-50 p-3"><p className="text-sm font-semibold text-emerald-950">Student sign-up link</p><p className="mt-1 break-all text-sm text-emerald-900">/student-signup?token={student.studentAccount.inviteToken}</p><p className="mt-1 text-xs text-emerald-800">Share this path with the student after adding your site address.</p></div> : null}
      </details>

      <section>
        <div className="mb-4 flex items-center gap-2"><BookOpen className="size-5 text-emerald-800" /><h2 className="text-xl font-semibold text-slate-950">Courses</h2></div>
        {student.courses.length === 0 ? <p className="mb-6 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-sm text-slate-600">No courses yet. Add the first one below.</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {student.courses.map((course) => (
            <Link key={course.id} href={`/students/${student.id}/courses/${course.id}`} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">{course.subject}</p><h3 className="mt-1 text-lg font-semibold text-slate-950">{course.title}</h3><p className="mt-2 text-sm text-slate-600">{course.curriculum?.title}</p></div><ArrowRight className="mt-2 size-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-800" /></div>
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-10"><CourseForm studentId={student.id} defaultEndDate={dateInputValue(student.schoolYear.endDate)} /></section>
    </main>
  );
}
