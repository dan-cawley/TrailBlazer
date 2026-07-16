import Link from "next/link";
import { ArrowRight, GraduationCap, Users } from "lucide-react";

import { StudentForm } from "@/components/student-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, supabase] = await Promise.all([searchParams, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const schoolYear = user
    ? await prisma.schoolYear.findFirst({
        where: { ownerId: user.id },
        orderBy: { updatedAt: "desc" },
        include: { students: { orderBy: { createdAt: "asc" }, include: { _count: { select: { courses: true } } } } },
      })
    : null;

  if (!schoolYear) {
    return (
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center px-4 py-12 text-center sm:px-6">
        <section className="max-w-md">
          <GraduationCap className="mx-auto size-10 text-emerald-800" />
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">Set up a school year first</h1>
          <p className="mt-3 text-slate-600">Students and courses need an active school year.</p>
          <Button asChild className="mt-6"><Link href="/onboarding/school-year">Set up school year</Link></Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">{schoolYear.label}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Students</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">Add each learner, then give them the courses they will work through.</p>
        </div>
      </div>
      {error ? <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">{error}</p> : null}
      <StudentForm schoolYearId={schoolYear.id} />

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Users className="size-5 text-emerald-800" />
          <h2 className="text-xl font-semibold text-slate-950">Your students</h2>
        </div>
        {schoolYear.students.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">Add your first student to begin building courses.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {schoolYear.students.map((student) => (
              <Link key={student.id} href={`/students/${student.id}`} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{student.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{student.grade} grade · {student._count.courses} {student._count.courses === 1 ? "course" : "courses"}</p>
                  </div>
                  <ArrowRight className="mt-1 size-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-800" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
