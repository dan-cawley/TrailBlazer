"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { updateNotificationPreferences } from "@/app/(app)/planning-actions";

type Preferences = {
  rolloverEnabled: boolean;
  planningEnabled: boolean;
} | null;

export function NotificationPreferences({ preferences }: { preferences: Preferences }) {
  const [rolloverEnabled, setRolloverEnabled] = useState(preferences?.rolloverEnabled ?? true);
  const [planningEnabled, setPlanningEnabled] = useState(preferences?.planningEnabled ?? true);

  return (
    <form action={updateNotificationPreferences} className="mt-3 flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
      <label className="flex items-center gap-2">
        <Checkbox
          name="rolloverEnabled"
          checked={rolloverEnabled}
          onCheckedChange={(checked) => setRolloverEnabled(checked === true)}
        />
        Rollover notices
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          name="planningEnabled"
          checked={planningEnabled}
          onCheckedChange={(checked) => setPlanningEnabled(checked === true)}
        />
        Planning and lock notices
      </label>
      <Button type="submit" size="sm" variant="outline">
        Save preferences
      </Button>
    </form>
  );
}
