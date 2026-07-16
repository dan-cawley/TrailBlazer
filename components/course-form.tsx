"use client";

import { useState } from "react";
import { FileUp, PenLine, Sparkles } from "lucide-react";

import { createCourse } from "@/app/(app)/students/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const days = [
  ["MONDAY", "Mon"],
  ["TUESDAY", "Tue"],
  ["WEDNESDAY", "Wed"],
  ["THURSDAY", "Thu"],
  ["FRIDAY", "Fri"],
] as const;

export function CourseForm({ studentId, defaultEndDate }: { studentId: string; defaultEndDate: string }) {
  const [source, setSource] = useState("MANUAL");
  const [meetingDays, setMeetingDays] = useState<string[]>(days.filter(([value]) => value !== "FRIDAY").map(([value]) => value));

  const toggleMeetingDay = (value: string) => {
    setMeetingDays((current) =>
      current.includes(value) ? current.filter((day) => day !== value) : [...current, value],
    );
  };

  return (
    <form action={createCourse} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <input type="hidden" name="studentId" value={studentId} />
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Add a course</h2>
        <p className="mt-1 text-sm text-slate-600">Courses belong to this student and will be scheduled in a later sprint.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="course-subject">Subject</Label>
          <Input id="course-subject" name="subject" placeholder="Science" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-title">Course title</Label>
          <Input id="course-title" name="title" placeholder="Life Science" required />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-800">Meeting days</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            {days.map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <Checkbox
                  name="meetingDays"
                  value={value}
                  checked={meetingDays.includes(value)}
                  onCheckedChange={(checked) => {
                    if (checked) toggleMeetingDay(value);
                    else setMeetingDays((current) => current.filter((day) => day !== value));
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-2">
          <Label htmlFor="course-target-end">Target end date</Label>
          <Input id="course-target-end" name="targetEndDate" type="date" defaultValue={defaultEndDate} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-notes">Parent notes <span className="font-normal text-slate-500">(optional)</span></Label>
        <textarea id="course-notes" name="parentNotes" rows={3} className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" placeholder="Odds only. Read together. Skip review questions." />
      </div>

      <fieldset className="border-t border-slate-200 pt-6">
        <legend className="text-base font-semibold text-slate-950">Curriculum</legend>
        <p className="mt-1 text-sm text-slate-600">Choose how you want to begin this course’s curriculum.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["MANUAL", "Create manually", "Build units and assignments after saving.", PenLine],
            ["UPLOAD", "Upload file", "Store a curriculum document for later review.", FileUp],
            ["TRAILBLAZER_LIBRARY", "TrailBlazer Library", "Record a library curriculum selection.", Sparkles],
          ].map(([value, label, description, Icon]) => {
            const SourceIcon = Icon as typeof PenLine;
            return (
              <label key={value as string} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50">
                <input type="radio" name="curriculumSource" value={value as string} checked={source === value} onChange={() => setSource(value as string)} className="mt-1 accent-emerald-700" />
                <SourceIcon className="mt-0.5 size-4 shrink-0 text-emerald-800" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{label as string}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{description as string}</span>
                </span>
              </label>
            );
          })}
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="curriculum-title">
            {source === "TRAILBLAZER_LIBRARY" ? "Library curriculum title" : "Curriculum title"}
          </Label>
          <Input id="curriculum-title" name="curriculumTitle" placeholder={source === "MANUAL" ? "Life Science, 2nd edition" : "Curriculum name"} required />
        </div>
        {source === "UPLOAD" ? (
          <div className="mt-4 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-4">
            <Label htmlFor="curriculum-file">Curriculum file</Label>
            <Input id="curriculum-file" name="curriculumFile" type="file" className="mt-2 bg-white" accept=".pdf,.doc,.docx,.csv,.xlsx,.xls,.txt,image/*" required />
            <p className="mt-2 text-xs text-slate-600">Documents, spreadsheets, or images up to 20 MB are stored securely for later review.</p>
          </div>
        ) : null}
      </fieldset>
      <Button type="submit">Save course</Button>
    </form>
  );
}
