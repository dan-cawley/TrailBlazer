import { AssignmentType } from "@prisma/client";

import { addAssignment, addUnit } from "@/app/(app)/students/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockButton } from "@/components/lock-button";

type Unit = {
  id: string;
  title: string;
  parentNotes: string | null;
  isLocked: boolean;
  position: number;
  assignments: {
    id: string;
    title: string;
    type: AssignmentType;
    parentNotes: string | null;
    estimatedMins: number | null;
    optional: boolean;
    position: number;
  }[];
};

export function ManualCurriculumBuilder({
  studentId,
  courseId,
  curriculumId,
  units,
}: {
  studentId: string;
  courseId: string;
  curriculumId: string;
  units: Unit[];
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Manual curriculum</h2>
          <p className="mt-1 text-sm text-slate-600">Add units and the work that belongs in each one. Scheduling comes later.</p>
        </div>
      </div>
      {units.map((unit) => (
        <article key={unit.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">Unit {unit.position}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">{unit.title}</h3>
              {unit.parentNotes ? <p className="mt-2 text-sm text-slate-600">{unit.parentNotes}</p> : null}
            </div>
            <div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{unit.assignments.length} assignments</span><LockButton kind="UNIT" studentId={studentId} courseId={courseId} entityId={unit.id} locked={unit.isLocked} /></div>
          </div>
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            {unit.assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-slate-900">{assignment.title}</span>
                  <span className="ml-2 text-slate-500">{assignment.type.toLowerCase()}</span>
                  {assignment.optional ? <span className="ml-2 text-emerald-800">Optional</span> : null}
                </div>
                {assignment.estimatedMins ? <span className="text-xs text-slate-500">{assignment.estimatedMins} min</span> : null}
              </div>
            ))}
            {unit.assignments.length === 0 ? <p className="text-sm text-slate-500">No assignments yet.</p> : null}
          </div>
          <form action={addAssignment} className="mt-5 grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
            <input type="hidden" name="studentId" value={studentId} />
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="unitId" value={unit.id} />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`assignment-title-${unit.id}`}>Add assignment</Label>
              <Input id={`assignment-title-${unit.id}`} name="title" placeholder="Chapter 1 reading" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`assignment-type-${unit.id}`}>Type</Label>
              <select id={`assignment-type-${unit.id}`} name="type" defaultValue="LESSON" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100">
                {Object.values(AssignmentType).map((type) => <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`assignment-time-${unit.id}`}>Estimated minutes <span className="font-normal text-slate-500">(optional)</span></Label>
              <Input id={`assignment-time-${unit.id}`} name="estimatedMins" type="number" min="1" max="1440" placeholder="30" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`assignment-notes-${unit.id}`}>Parent notes <span className="font-normal text-slate-500">(optional)</span></Label>
              <Input id={`assignment-notes-${unit.id}`} name="parentNotes" placeholder="Read together" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700"><Checkbox name="optional" /> Optional assignment</label>
            <Button type="submit" variant="outline">Add assignment</Button>
          </form>
        </article>
      ))}
      <form action={addUnit} className="grid gap-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <input type="hidden" name="studentId" value={studentId} />
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="curriculumId" value={curriculumId} />
        <div className="space-y-2">
          <Label htmlFor="unit-title">Add unit</Label>
          <Input id="unit-title" name="title" placeholder="Unit 1: Living things" required />
          <Input name="parentNotes" placeholder="Parent notes (optional)" />
        </div>
        <Button type="submit">Add unit</Button>
      </form>
    </section>
  );
}
