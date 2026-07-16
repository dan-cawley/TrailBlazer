import { Lock, Unlock } from "lucide-react";

import { toggleLock } from "@/app/(app)/planning-actions";
import { Button } from "@/components/ui/button";

export function LockButton({
  kind,
  studentId,
  courseId,
  entityId,
  locked,
}: {
  kind: "COURSE" | "UNIT" | "ASSIGNMENT";
  studentId: string;
  courseId: string;
  entityId?: string;
  locked: boolean;
}) {
  return <form action={toggleLock}><input type="hidden" name="kind" value={kind} /><input type="hidden" name="studentId" value={studentId} /><input type="hidden" name="courseId" value={courseId} /><input type="hidden" name="entityId" value={entityId ?? ""} /><input type="hidden" name="locked" value={String(!locked)} /><Button type="submit" variant="ghost" size="sm">{locked ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}{locked ? "Unlock" : "Lock"}</Button></form>;
}
