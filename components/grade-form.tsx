import { recordGrade } from "@/app/(app)/records-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GradeForm({ scheduledAssignmentId, studentId, courseId, grade }: { scheduledAssignmentId: string; studentId: string; courseId: string; grade?: { score: { toString(): string }; possiblePoints: { toString(): string }; notes: string | null } | null }) {
  return <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-emerald-900">{grade ? `Grade: ${grade.score.toString()}/${grade.possiblePoints.toString()}` : "Record grade"}</summary><form action={recordGrade} className="mt-2 grid gap-2 sm:grid-cols-3"><input type="hidden" name="scheduledAssignmentId" value={scheduledAssignmentId} /><input type="hidden" name="studentId" value={studentId} /><input type="hidden" name="courseId" value={courseId} /><Input name="score" type="number" min="0" step="0.01" defaultValue={grade?.score.toString()} placeholder="Score" required /><Input name="possiblePoints" type="number" min="0.01" step="0.01" defaultValue={grade?.possiblePoints.toString()} placeholder="Possible" required /><Button type="submit" size="sm" variant="outline">Save grade</Button><Input name="notes" className="sm:col-span-3" defaultValue={grade?.notes ?? ""} placeholder="Grade notes (optional)" /></form></details>;
}
