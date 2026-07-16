import Link from "next/link";
import { Compass } from "lucide-react";

import { signIn, signUp } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const message = (await searchParams).message;

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,_#d1fae5,_transparent_36%),linear-gradient(#f8faf9,#f8faf9)] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-emerald-950/5 sm:p-9">
        <Link href="/" className="mb-8 flex items-center gap-2 text-emerald-950">
          <span className="grid size-9 place-items-center rounded-lg bg-emerald-700 text-white">
            <Compass className="size-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">TrailBlazer</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Welcome</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in to set up your homeschool year and keep your plan on track.
        </p>

        {message ? (
          <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
            {message}
          </p>
        ) : null}

        <form className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
          </div>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Button formAction={signIn}>Sign in</Button>
            <Button formAction={signUp} variant="outline">
              Create account
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
