import Link from "next/link";
import { CalendarDays, ChevronRight, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { dismissNotification, updateNotificationPreferences } from "@/app/(app)/planning-actions";
import { RolloverProcessor } from "@/components/rollover-processor";
import { addDays, dateKey, formatDate, todayUtc } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = todayUtc();
  const tomorrow = addDays(today, 1);
  const schoolYear = user
    ? await prisma.schoolYear.findFirst({
        where: { ownerId: user.id },
        orderBy: { updatedAt: "desc" },
        include: { students: { orderBy: { createdAt: "asc" } } },
      })
    : null;
  const scheduled = user && schoolYear
    ? await prisma.scheduledAssignment.findMany({
        where: { course: { student: { schoolYearId: schoolYear.id } }, scheduledDate: { gte: today, lte: tomorrow } },
        include: { course: { include: { student: true } } },
      })
    : [];
  const notifications = user
    ? await prisma.notification.findMany({ where: { ownerId: user.id, dismissedAt: null }, orderBy: { createdAt: "desc" }, take: 8 })
    : [];
  const preferences = user ? await prisma.notificationPreference.findUnique({ where: { ownerId: user.id } }) : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {schoolYear ? <RolloverProcessor /> : null}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">{formatDate(today, { weekday: "long", month: "long", day: "numeric" })}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Parent dashboard</h1><p className="mt-3 text-base text-slate-600">A calm view of what each student has planned today.</p></div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href={`/schedule/week?date=${dateKey(today)}`}>Week</Link></Button><Button asChild variant="outline"><Link href={`/schedule/month?date=${dateKey(today)}`}>Month</Link></Button><Button asChild variant="outline"><Link href="/schedule/year">Year</Link></Button></div>
      </div>

      {!schoolYear ? <section className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600"><p>Set up a school year before viewing a dashboard.</p><Button asChild className="mt-4"><Link href="/onboarding/school-year">School year setup</Link></Button></section> : null}
      {schoolYear ? <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-semibold text-slate-950">Notifications</h2><p className="mt-1 text-sm text-slate-600">Only items that need attention or planning.</p></div><details className="text-sm"><summary className="cursor-pointer font-semibold text-emerald-900">Preferences</summary><form action={updateNotificationPreferences} className="mt-3 flex flex-col gap-2 rounded-lg border border-slate-200 p-3"><label className="flex items-center gap-2"><Checkbox name="rolloverEnabled" defaultChecked={preferences?.rolloverEnabled ?? true} />Rollover notices</label><label className="flex items-center gap-2"><Checkbox name="planningEnabled" defaultChecked={preferences?.planningEnabled ?? true} />Planning and lock notices</label><Button type="submit" size="sm" variant="outline">Save preferences</Button></form></details></div><div className="mt-4 space-y-2">{notifications.map((notification) => <div key={notification.id} className="flex flex-col justify-between gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-slate-900">{notification.title}</p><p className="mt-1 text-sm text-slate-600">{notification.message}</p></div><form action={dismissNotification}><input type="hidden" name="notificationId" value={notification.id} /><Button type="submit" size="sm" variant="ghost">Dismiss</Button></form></div>)}{notifications.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">You&apos;re all caught up.</p> : null}</div></section> : null}
      {schoolYear ? <section className="mt-10"><div className="mb-4 flex items-center gap-2"><Users className="size-5 text-emerald-800" /><h2 className="text-xl font-semibold text-slate-950">Students</h2></div><div className="grid gap-4 md:grid-cols-2">
        {schoolYear.students.map((student) => {
          const todayItems = scheduled.filter((item) => item.course.studentId === student.id && dateKey(item.scheduledDate) === dateKey(today));
          const tomorrowItems = scheduled.filter((item) => item.course.studentId === student.id && dateKey(item.scheduledDate) === dateKey(tomorrow));
          const completed = todayItems.filter((item) => item.status === "COMPLETED").length;
          return <Link key={student.id} href={`/students/${student.id}/today`} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold text-slate-950">{student.name}</h3><p className="mt-1 text-sm text-slate-600">{student.grade} grade</p></div><ChevronRight className="mt-1 size-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-800" /></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-emerald-50 p-3"><span className="block font-semibold text-emerald-950">{completed}/{todayItems.length}</span><span className="text-emerald-800">today completed</span></div><div className="rounded-lg bg-slate-50 p-3"><span className="block font-semibold text-slate-900">{tomorrowItems.length}</span><span className="text-slate-600">tomorrow planned</span></div></div></Link>;
        })}
        {schoolYear.students.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Add students and courses to begin planning.</div> : null}
      </div></section> : null}
      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CalendarDays className="size-5 text-emerald-800" /><h2 className="text-xl font-semibold text-slate-950">Plan views</h2></div><p className="mt-2 text-sm text-slate-600">Review the same saved plan by week, month, or its year-long pacing guide.</p><div className="mt-4 flex flex-wrap gap-3"><Button asChild variant="outline"><Link href={`/schedule/week?date=${dateKey(today)}`}>View week</Link></Button><Button asChild variant="outline"><Link href={`/schedule/month?date=${dateKey(today)}`}>View month</Link></Button><Button asChild variant="outline"><Link href="/schedule/year">View pacing guide</Link></Button></div></section>
    </main>
  );
}
