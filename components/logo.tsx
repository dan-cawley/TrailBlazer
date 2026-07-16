import { Compass } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-emerald-950">
      <span className="grid size-8 place-items-center rounded-lg bg-emerald-700 text-white">
        <Compass className="size-4" />
      </span>
      <span className="text-lg font-bold tracking-tight">TrailBlazer</span>
    </div>
  );
}
