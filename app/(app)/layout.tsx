import { redirect } from "next/navigation";

import { AppNav } from "@/components/app-nav";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function AuthenticatedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const studentAccount = await prisma.studentAccount.findUnique({ where: { authUserId: user.id } });
  if (studentAccount) redirect("/student");

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />
      {children}
    </div>
  );
}
