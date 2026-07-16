"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RolloverProcessor() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch("/api/rollovers", { method: "POST" })
      .then((response) => response.json())
      .then((result: { rolledOver?: number; blocked?: number }) => {
        if (active && ((result.rolledOver ?? 0) > 0 || (result.blocked ?? 0) > 0)) router.refresh();
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [router]);

  return null;
}
