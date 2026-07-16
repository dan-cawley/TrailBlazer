import { SchoolDay, VacationKind } from "@prisma/client";

type Vacation = {
  kind: VacationKind;
  startDate: Date | null;
  endDate: Date | null;
};

const weekdayToSchoolDay: Record<number, SchoolDay | undefined> = {
  1: SchoolDay.MONDAY,
  2: SchoolDay.TUESDAY,
  3: SchoolDay.WEDNESDAY,
  4: SchoolDay.THURSDAY,
  5: SchoolDay.FRIDAY,
};

function utcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const result = utcDay(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function fourthThursdayOfNovember(year: number) {
  const first = new Date(Date.UTC(year, 10, 1));
  const offset = (4 - first.getUTCDay() + 7) % 7;
  return addDays(first, offset + 21);
}

function thirdMondayOfMarch(year: number) {
  const first = new Date(Date.UTC(year, 2, 1));
  const offset = (1 - first.getUTCDay() + 7) % 7;
  return addDays(first, offset + 14);
}

function inRange(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function presetVacationRanges(vacations: Vacation[], start: Date, end: Date) {
  const ranges: { start: Date; end: Date }[] = [];
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();

  for (const vacation of vacations) {
    if (vacation.startDate && vacation.endDate) {
      ranges.push({ start: utcDay(vacation.startDate), end: utcDay(vacation.endDate) });
      continue;
    }

    for (let year = startYear - 1; year <= endYear; year += 1) {
      if (vacation.kind === VacationKind.THANKSGIVING) {
        const thanksgiving = fourthThursdayOfNovember(year);
        ranges.push({ start: thanksgiving, end: addDays(thanksgiving, 1) });
      }
      if (vacation.kind === VacationKind.CHRISTMAS) {
        ranges.push({ start: new Date(Date.UTC(year, 11, 24)), end: new Date(Date.UTC(year + 1, 0, 1)) });
      }
      if (vacation.kind === VacationKind.SPRING_BREAK) {
        const springBreak = thirdMondayOfMarch(year);
        ranges.push({ start: springBreak, end: addDays(springBreak, 4) });
      }
    }
  }

  return ranges.filter((range) => range.end >= start && range.start <= end);
}

export function availableCourseDates({
  schoolYearStart,
  schoolYearEnd,
  targetEnd,
  startAt,
  schoolDays,
  meetingDays,
  vacations,
}: {
  schoolYearStart: Date;
  schoolYearEnd: Date;
  targetEnd: Date;
  startAt?: Date;
  schoolDays: SchoolDay[];
  meetingDays: SchoolDay[];
  vacations: Vacation[];
}) {
  const start = utcDay(startAt && startAt > schoolYearStart ? startAt : schoolYearStart);
  const end = utcDay(targetEnd < schoolYearEnd ? targetEnd : schoolYearEnd);
  const activeDays = new Set(meetingDays.filter((day) => schoolDays.includes(day)));
  const vacationRanges = presetVacationRanges(vacations, start, end);
  const dates: Date[] = [];

  for (let day = start; day <= end; day = addDays(day, 1)) {
    const schoolDay = weekdayToSchoolDay[day.getUTCDay()];
    if (!schoolDay || !activeDays.has(schoolDay)) continue;
    if (vacationRanges.some((range) => inRange(day, range.start, range.end))) continue;
    dates.push(day);
  }

  return dates;
}

export function distributeAssignments(assignmentIds: string[], dates: Date[]) {
  if (dates.length === 0) return [];

  return assignmentIds.map((assignmentId, index) => {
    const dateIndex = assignmentIds.length === 1
      ? 0
      : Math.round((index * (dates.length - 1)) / (assignmentIds.length - 1));
    return { assignmentId, scheduledDate: dates[dateIndex], position: index + 1 };
  });
}
