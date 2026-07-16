import Link from "next/link";
import { CalendarDays, ClipboardCheck, LayoutDashboard, Users } from "lucide-react";

import { signOut } from "@/app/(app)/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function AppNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/onboarding/school-year" aria-label="TrailBlazer school year setup">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-950"
          >
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link
            href="/onboarding/school-year"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-950"
          >
            <CalendarDays className="size-4" />
            <span className="hidden sm:inline">School year</span>
          </Link>
          <Link
            href="/students"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-950"
          >
            <Users className="size-4" />
            <span className="hidden sm:inline">Students</span>
          </Link>
          <Link
            href="/attendance"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-950"
          >
            <ClipboardCheck className="size-4" />
            <span>Records</span>
          </Link>
          <form action={signOut}>
            <Button variant="ghost" size="sm" className="ml-1">
              Sign out
            </Button>
          </form>
        </nav>
        <form className="md:hidden" action={signOut}><Button variant="ghost" size="sm">Sign out</Button></form>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur md:hidden" aria-label="Mobile navigation">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 rounded-md py-1 text-xs font-medium text-slate-600"><LayoutDashboard className="size-5" />Today</Link>
        <Link href="/students" className="flex flex-col items-center gap-1 rounded-md py-1 text-xs font-medium text-slate-600"><Users className="size-5" />Students</Link>
        <Link href="/schedule/week" className="flex flex-col items-center gap-1 rounded-md py-1 text-xs font-medium text-slate-600"><CalendarDays className="size-5" />Plan</Link>
        <Link href="/attendance" className="flex flex-col items-center gap-1 rounded-md py-1 text-xs font-medium text-slate-600"><ClipboardCheck className="size-5" />Records</Link>
      </nav>
    </header>
  );
}
