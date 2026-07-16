import { NextResponse } from "next/server";

import { processRolloversForOwner } from "@/lib/rollovers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await processRolloversForOwner(user.id));
}
