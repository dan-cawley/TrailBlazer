import { createStudent } from "@/app/(app)/students/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StudentForm({ schoolYearId }: { schoolYearId: string }) {
  return (
    <form action={createStudent} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_10rem_auto] sm:items-end sm:p-6">
      <input type="hidden" name="schoolYearId" value={schoolYearId} />
      <div className="space-y-2">
        <Label htmlFor="student-name">Student name</Label>
        <Input id="student-name" name="name" placeholder="Emma Trailblazer" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-grade">Grade</Label>
        <Input id="student-grade" name="grade" placeholder="6th" required />
      </div>
      <Button type="submit">Add student</Button>
    </form>
  );
}
