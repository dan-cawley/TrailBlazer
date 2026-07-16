"use server";

import { CalendarSource, Prisma, SchoolDay, VacationKind } from "@prisma/client";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const schoolDayValues = Object.values(SchoolDay);
const MAX_CALENDAR_FILE_SIZE = 10 * 1024 * 1024;

function setupUrl(error: string): Route {
  return `/onboarding/school-year?error=${encodeURIComponent(error)}` as Route;
}

function dateFromForm(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function selected(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export async function saveSchoolYear(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const startDate = dateFromForm(String(formData.get("startDate") ?? ""));
  const endDate = dateFromForm(String(formData.get("endDate") ?? ""));
  const schoolDays = formData
    .getAll("schoolDays")
    .map(String)
    .filter((day): day is SchoolDay => schoolDayValues.includes(day as SchoolDay));
  const source = String(formData.get("calendarSource") ?? "");
  const calendarSource =
    source === CalendarSource.DISTRICT_UPLOAD
      ? CalendarSource.DISTRICT_UPLOAD
      : CalendarSource.TRAILBLAZER_DEFAULTS;

  if (!label) redirect(setupUrl("School year is required."));
  if (!startDate) redirect(setupUrl("Start date is required."));
  if (!endDate) redirect(setupUrl("End date is required."));
  if (startDate >= endDate) redirect(setupUrl("End date must be after the start date."));
  if (schoolDays.length === 0) redirect(setupUrl("Choose at least one school day."));

  const customVacationEnabled = selected(formData, "customVacationEnabled");
  const customVacationName = String(formData.get("customVacationName") ?? "").trim();
  const customStartDate = dateFromForm(String(formData.get("customStartDate") ?? ""));
  const customEndDate = dateFromForm(String(formData.get("customEndDate") ?? ""));
  if (customVacationEnabled) {
    if (!customVacationName || !customStartDate || !customEndDate) {
      redirect(setupUrl("Enter a name, start date, and end date for your custom vacation."));
    }
    if (customStartDate > customEndDate) {
      redirect(setupUrl("A custom vacation cannot end before it starts."));
    }
  }

  const vacations: Prisma.VacationCreateWithoutSchoolYearInput[] = [];
  if (selected(formData, "thanksgiving")) {
    vacations.push({ kind: VacationKind.THANKSGIVING, label: "Thanksgiving" });
  }
  if (selected(formData, "christmas")) {
    vacations.push({ kind: VacationKind.CHRISTMAS, label: "Christmas" });
  }
  if (selected(formData, "springBreak")) {
    vacations.push({ kind: VacationKind.SPRING_BREAK, label: "Spring Break" });
  }
  if (customVacationEnabled && customStartDate && customEndDate) {
    vacations.push({
      kind: VacationKind.CUSTOM,
      label: customVacationName,
      startDate: customStartDate,
      endDate: customEndDate,
    });
  }

  const fileEntry = formData.get("calendarFile");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  if (calendarSource === CalendarSource.DISTRICT_UPLOAD && !file) {
    redirect(setupUrl("Choose a district calendar file to upload."));
  }
  if (file && file.size > MAX_CALENDAR_FILE_SIZE) {
    redirect(setupUrl("District calendar files must be 10 MB or smaller."));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let uploadData:
    | { storagePath: string; fileName: string; mimeType: string | null; sizeBytes: number }
    | undefined;
  if (file) {
    const bucket = process.env.SUPABASE_CALENDAR_BUCKET ?? "district-calendars";
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
    const storagePath = `${user.id}/${crypto.randomUUID()}-${safeFileName || "district-calendar"}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });
    if (uploadError) redirect(setupUrl(`Calendar upload failed: ${uploadError.message}`));
    uploadData = {
      storagePath,
      fileName: file.name || "district-calendar",
      mimeType: file.type || null,
      sizeBytes: file.size,
    };
  }

  try {
    await prisma.schoolYear.upsert({
      where: { ownerId_label: { ownerId: user.id, label } },
      create: {
        ownerId: user.id,
        label,
        startDate,
        endDate,
        schoolDays,
        calendarSource,
        vacations: { create: vacations },
        ...(uploadData ? { calendarUpload: { create: uploadData } } : {}),
      },
      update: {
        startDate,
        endDate,
        schoolDays,
        calendarSource,
        vacations: { deleteMany: {}, create: vacations },
        ...(uploadData ? { calendarUpload: { upsert: { create: uploadData, update: uploadData } } } : {}),
      },
    });
  } catch {
    redirect(setupUrl("We could not save your school year. Check your database setup and try again."));
  }

  redirect("/students");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
