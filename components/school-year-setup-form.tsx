"use client";

import { useState } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import { useFormStatus } from "react-dom";

import { saveSchoolYear } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InitialSchoolYear = {
  label: string;
  startDate: string;
  endDate: string;
  schoolDays: string[];
  calendarSource: "TRAILBLAZER_DEFAULTS" | "DISTRICT_UPLOAD";
  vacationKinds: string[];
  customVacation?: { label: string; startDate: string; endDate: string };
  uploadedFileName?: string;
};

const days = [
  ["MONDAY", "Monday"],
  ["TUESDAY", "Tuesday"],
  ["WEDNESDAY", "Wednesday"],
  ["THURSDAY", "Thursday"],
  ["FRIDAY", "Friday"],
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? "Saving school year…" : "Save and continue"}
    </Button>
  );
}

export function SchoolYearSetupForm({ initial }: { initial?: InitialSchoolYear }) {
  const [calendarSource, setCalendarSource] = useState(initial?.calendarSource ?? "TRAILBLAZER_DEFAULTS");
  const [customVacationEnabled, setCustomVacationEnabled] = useState(Boolean(initial?.customVacation));
  const selectedDays = initial?.schoolDays ?? days.map(([value]) => value);
  const vacationKinds = initial?.vacationKinds ?? ["THANKSGIVING", "CHRISTMAS", "SPRING_BREAK"];

  return (
    <form action={saveSchoolYear} className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">School year</h2>
          <p className="mt-1 text-sm text-slate-600">Start with the days your family plans to learn.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="label">School Year</Label>
            <Input id="label" name="label" placeholder="2026–2027" defaultValue={initial?.label} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={initial?.startDate} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" name="endDate" type="date" defaultValue={initial?.endDate} required />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">School Days</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              {days.map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <Checkbox name="schoolDays" value={value} defaultChecked={selectedDays.includes(value)} />
                  {label.slice(0, 3)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Calendar source</h2>
          <p className="mt-1 text-sm text-slate-600">Use TrailBlazer holiday defaults or keep a district calendar on file.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50">
            <input
              type="radio"
              name="calendarSource"
              value="TRAILBLAZER_DEFAULTS"
              checked={calendarSource === "TRAILBLAZER_DEFAULTS"}
              onChange={() => setCalendarSource("TRAILBLAZER_DEFAULTS")}
              className="mt-1 accent-emerald-700"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">TrailBlazer Defaults</span>
              <span className="mt-1 block text-sm leading-5 text-slate-600">Choose your school days and common breaks below.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50">
            <input
              type="radio"
              name="calendarSource"
              value="DISTRICT_UPLOAD"
              checked={calendarSource === "DISTRICT_UPLOAD"}
              onChange={() => setCalendarSource("DISTRICT_UPLOAD")}
              className="mt-1 accent-emerald-700"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Upload District Calendar</span>
              <span className="mt-1 block text-sm leading-5 text-slate-600">Save a district calendar now; it will be reviewed later.</span>
            </span>
          </label>
        </div>
        {calendarSource === "DISTRICT_UPLOAD" ? (
          <div className="mt-4 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-4">
            <Label htmlFor="calendarFile" className="flex items-center gap-2">
              <Upload className="size-4 text-emerald-800" />
              District calendar file
            </Label>
            <Input id="calendarFile" name="calendarFile" type="file" className="mt-2 bg-white" accept=".pdf,.csv,.ics,.xlsx,.xls,image/*" required />
            <p className="mt-2 text-xs leading-5 text-slate-600">
              PDF, spreadsheet, calendar, or image file up to 10 MB. {initial?.uploadedFileName ? `Current file: ${initial.uploadedFileName}.` : ""}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">Vacations</h2>
          <p className="mt-1 text-sm text-slate-600">Select breaks you know you will observe. You can add details later.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["thanksgiving", "THANKSGIVING", "Thanksgiving"],
            ["christmas", "CHRISTMAS", "Christmas"],
            ["springBreak", "SPRING_BREAK", "Spring Break"],
          ].map(([name, kind, label]) => (
            <label key={name} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-800">
              <Checkbox name={name} defaultChecked={vacationKinds.includes(kind)} />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-900">
            <Checkbox
              name="customVacationEnabled"
              checked={customVacationEnabled}
              onCheckedChange={(checked) => setCustomVacationEnabled(checked === true)}
            />
            Add Custom Vacation
          </label>
          {customVacationEnabled ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="customVacationName">Vacation name</Label>
                <Input id="customVacationName" name="customVacationName" defaultValue={initial?.customVacation?.label} placeholder="Family trip" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customStartDate">Start date</Label>
                <Input id="customStartDate" name="customStartDate" type="date" defaultValue={initial?.customVacation?.startDate} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customEndDate">End date</Label>
                <Input id="customEndDate" name="customEndDate" type="date" defaultValue={initial?.customVacation?.endDate} required />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-600">You can update these choices before scheduling begins.</p>
        <SubmitButton />
      </div>
    </form>
  );
}
