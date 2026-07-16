# TrailBlazer

TrailBlazer is a homeschool scheduling engine. This repository implements setup, curriculum, scheduling, dashboards, rollovers, locks, notifications, student accounts, and parent records.

## Included in Sprint 1

- Next.js 15, TypeScript, Tailwind CSS, and local shadcn-style UI primitives
- Supabase email/password authentication with email confirmation callback
- Prisma/Postgres schema and initial migration
- Protected application navigation
- School Year Setup: label, start/end dates, Monday–Friday school days, calendar source, preset breaks, and one custom vacation range
- Private Supabase Storage upload for district calendar files (up to 10 MB)
- Save-and-continue flow to the Students screen
- Student profiles with name and grade
- Courses with meeting days, target end date, parent notes, and curriculum selection
- Manual curriculum builder for units and assignments; secure curriculum-file uploads
- Automatic year-plan generation using school days, breaks, meeting days, and target end dates
- Parent, student Today, Week, Month, Year/Pacing Guide, and Course progress views
- Assignment completion states, automatic rollovers, parent adjustments, locks, and notifications
- Parent-created student invitations and a restricted student dashboard
- Attendance records and per-assignment grades

## Project structure

```text
app/
  (app)/                         protected screens and server actions
    onboarding/school-year/      School Year Setup
    students/                    student, course, and curriculum management
  (auth)/login/                  sign in and account creation
  auth/callback/                 email-confirmation callback
components/
  ui/                            reusable shadcn-style form primitives
lib/
  supabase/                      browser/server Supabase clients
  prisma.ts                      shared Prisma client
prisma/
  schema.prisma                  data model
  migrations/                    initial Postgres migration
supabase/storage.sql             private upload-bucket policies
```

## Local setup

### Fast path

After you create and configure a Supabase project, run:

```bash
bash scripts/setup-local.sh
```

On its first run the script creates `.env.local` from the template and tells you which values to add. On its second run it installs packages, generates Prisma, and applies the committed migration. Prisma reads the same `.env.local` database URL as Next.js. You must still run the Storage SQL in Step 4 below once, because creating cloud buckets and policies requires your Supabase project authorization.

### Manual setup

1. Create a Supabase project. In **Authentication → Providers**, enable Email. For local development, add `http://localhost:3000/auth/callback` to the allowed redirect URLs.
2. Copy the environment template and add your project values:

   ```bash
   cp .env.example .env.local
   ```

   `DATABASE_URL` must be a direct PostgreSQL connection string for your Supabase project. Keep `.env.local` out of source control.
3. Create the database tables:

   ```bash
   npm run db:generate
   npx prisma migrate deploy
   ```

4. In the Supabase SQL Editor, run [`supabase/storage.sql`](supabase/storage.sql). It creates the private `district-calendars` bucket and limits each parent to their own files.
5. Start the application:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`, create an account, confirm the email if your Supabase project requires it, and complete School Year Setup.

## Useful commands

```bash
npm run dev          # local development server
npm run lint         # ESLint
npm run build        # production build and type-check
npm run db:generate  # generate Prisma client
npm run db:migrate   # create/apply a development migration
npx prisma migrate deploy # apply committed migrations in deployed environments
```

## Student accounts and records

1. Open a student profile and expand **Student account**.
2. Enter the student’s email and create the invitation.
3. Share the displayed path with your site address, for example `http://localhost:3000/student-signup?token=...`.
4. The student creates a password and confirms their email if required by Supabase. Their account opens the restricted `/student` dashboard.

Parents can record attendance at `/attendance`, and record grades from an assignment on a course plan. `/grades` provides a compact course summary.

## Intentionally deferred

- District-calendar and curriculum-file parsing are intentionally not implemented. The files and metadata are stored securely for future review.
- A hosted background scheduler is intentionally not configured. Rollovers process automatically when a parent opens the dashboard.
- Preset vacation selections are stored now. Assigning their exact dates is deferred until scheduling work, because the product specification does not define those date ranges.
