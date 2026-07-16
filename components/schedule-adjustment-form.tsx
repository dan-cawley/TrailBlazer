import { applyScheduleAdjustment, rebuildSchoolYear } from "@/app/(app)/planning-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ScheduleAdjustmentForm({
  studentId,
  courseId,
  items,
}: {
  studentId: string;
  courseId: string;
  items: { id: string; assignment: { title: string }; scheduledDate: Date }[];
}) {
  if (items.length === 0) return null;
  return <details className="mt-5 rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-emerald-900">Adjust schedule</summary><form action={applyScheduleAdjustment} className="mt-4 grid gap-4 sm:grid-cols-2"><input type="hidden" name="studentId" value={studentId} /><input type="hidden" name="courseId" value={courseId} /><div className="space-y-2"><Label htmlFor="adjustment-action">Action</Label><select id="adjustment-action" name="action" defaultValue="DOUBLE_UP" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"><option value="DOUBLE_UP">Double Up</option><option value="WEEK">Adjust This Week</option><option value="UNIT">Adjust This Unit</option><option value="COURSE">Adjust This Course</option></select></div><div className="space-y-2"><Label htmlFor="adjustment-item">Assignment</Label><select id="adjustment-item" name="scheduledAssignmentId" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100">{items.map((item) => <option key={item.id} value={item.id}>{item.assignment.title}</option>)}</select></div><div className="space-y-2"><Label htmlFor="double-up-date">Double Up date</Label><Input id="double-up-date" name="targetDate" type="date" defaultValue={items[0].scheduledDate.toISOString().slice(0, 10)} /></div><div className="flex items-end"><Button type="submit" variant="outline">Apply adjustment</Button></div></form><form action={rebuildSchoolYear} className="mt-4 border-t border-slate-100 pt-4"><input type="hidden" name="studentId" value={studentId} /><input type="hidden" name="courseId" value={courseId} /><Button type="submit" variant="ghost">Rebuild School Year</Button></form></details>;
}
