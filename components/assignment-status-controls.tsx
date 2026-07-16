import { AssignmentStatus } from "@prisma/client";

import { setAssignmentStatus } from "@/app/(app)/schedule-actions";
import { Button } from "@/components/ui/button";

export function AssignmentStatusControls({
  scheduledAssignmentId,
  studentId,
  status,
}: {
  scheduledAssignmentId: string;
  studentId: string;
  status: AssignmentStatus;
}) {
  if (status === AssignmentStatus.COMPLETED) {
    return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">Completed</span>;
  }

  return (
    <div className="flex shrink-0 gap-2">
      <form action={setAssignmentStatus}>
        <input type="hidden" name="scheduledAssignmentId" value={scheduledAssignmentId} />
        <input type="hidden" name="studentId" value={studentId} />
        <input type="hidden" name="status" value="PARTIALLY_COMPLETED" />
        <Button type="submit" size="sm" variant={status === AssignmentStatus.PARTIALLY_COMPLETED ? "secondary" : "outline"}>Partial</Button>
      </form>
      <form action={setAssignmentStatus}>
        <input type="hidden" name="scheduledAssignmentId" value={scheduledAssignmentId} />
        <input type="hidden" name="studentId" value={studentId} />
        <input type="hidden" name="status" value="COMPLETED" />
        <Button type="submit" size="sm">Complete</Button>
      </form>
    </div>
  );
}
