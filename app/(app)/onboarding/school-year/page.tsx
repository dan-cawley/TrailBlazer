import { SchoolYearSetupForm } from "@/components/school-year-setup-form";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function SchoolYearSetupPage({
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
        include: { vacations: true, calendarUpload: true },
      })
    : null;
  const customVacation = schoolYear?.vacations.find((vacation) => vacation.kind === "CUSTOM");
  const initial = schoolYear
    ? {
        label: schoolYear.label,
        startDate: dateInputValue(schoolYear.startDate),
        endDate: dateInputValue(schoolYear.endDate),
        schoolDays: schoolYear.schoolDays,
        calendarSource: schoolYear.calendarSource,
        vacationKinds: schoolYear.vacations.map((vacation) => vacation.kind),
        customVacation:
          customVacation?.startDate && customVacation.endDate
            ? {
                label: customVacation.label,
                startDate: dateInputValue(customVacation.startDate),
                endDate: dateInputValue(customVacation.endDate),
              }
            : undefined,
        uploadedFileName: schoolYear.calendarUpload?.fileName,
      }
    : undefined;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Step 1 of 2</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Set up your school year</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Tell TrailBlazer when school happens and which breaks to plan around.
        </p>
      </div>
      {error ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}
      <SchoolYearSetupForm initial={initial} />
    </main>
  );
}
