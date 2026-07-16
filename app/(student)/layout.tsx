import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const account = await prisma.studentAccount.findUnique({ where: { authUserId: user.id } });
  if (!account) redirect("/dashboard");
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
