import { AssignmentStatus, NotificationType } from "@prisma/client";

import { dateKey, todayUtc, weekStart } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { availableCourseDates } from "@/lib/scheduling";

async function createNotification({
  ownerId,
  type,
  title,
  message,
  dedupeKey,
}: {
  ownerId: string;
  type: NotificationType;
  title: string;
  message: string;
  dedupeKey: string;
}) {
  await prisma.notification.upsert({
    where: { dedupeKey },
    create: { ownerId, type, title, message, dedupeKey },
    update: {},
  });
}

export async function processRolloversForOwner(ownerId: string) {
  const today = todayUtc();
  const preferences = await prisma.notificationPreference.upsert({
    where: { ownerId },
    create: { ownerId },
    update: {},
  });
  const overdue = await prisma.scheduledAssignment.findMany({
    where: {
      status: AssignmentStatus.NOT_STARTED,
      scheduledDate: { lt: today },
      course: { student: { schoolYear: { ownerId } } },
    },
    include: {
      assignment: { include: { unit: true } },
      course: {
        include: {
          student: {
            include: {
              schoolYear: { include: { vacations: true, weekLocks: true } },
            },
          },
        },
      },
    },
  });

  let rolledOver = 0;
  let blocked = 0;
  for (const item of overdue) {
    const schoolYear = item.course.student.schoolYear;
    const lockedWeek = schoolYear.weekLocks.some(
      (lock) => dateKey(lock.weekStart) === dateKey(weekStart(item.scheduledDate)),
    );
    const locked = item.isLocked || item.assignment.unit.isLocked || item.course.isLocked || lockedWeek;
    const sourceDateKey = dateKey(item.scheduledDate);

    if (locked) {
      blocked += 1;
      if (preferences.planningEnabled) {
        await createNotification({
          ownerId,
          type: NotificationType.LOCKED_ITEM,
          title: "Locked item prevents adjustment",
          message: `${item.assignment.title} for ${item.course.student.name} could not roll over because it is locked.`,
          dedupeKey: `locked-${item.id}-${sourceDateKey}`,
        });
      }
      continue;
    }

    const nextDates = availableCourseDates({
      schoolYearStart: schoolYear.startDate,
      schoolYearEnd: schoolYear.endDate,
      targetEnd: item.course.targetEndDate,
      startAt: today,
      schoolDays: schoolYear.schoolDays,
      meetingDays: item.course.meetingDays,
      vacations: schoolYear.vacations,
    });
    const nextDate = nextDates[0];
    if (!nextDate) {
      blocked += 1;
      if (preferences.planningEnabled) {
        await createNotification({
          ownerId,
          type: NotificationType.LOCKED_ITEM,
          title: "Course needs attention",
          message: `${item.assignment.title} for ${item.course.student.name} has no remaining eligible school day before the target end date.`,
          dedupeKey: `no-date-${item.id}-${sourceDateKey}`,
        });
      }
      continue;
    }

    await prisma.scheduledAssignment.update({ where: { id: item.id }, data: { scheduledDate: nextDate } });
    rolledOver += 1;
    if (preferences.rolloverEnabled) {
      await createNotification({
        ownerId,
        type: NotificationType.ROLLOVER,
        title: `${item.course.student.name} has a rollover assignment`,
        message: `${item.assignment.title} moved to ${nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}.`,
        dedupeKey: `rollover-${item.id}-${sourceDateKey}`,
      });
    }
  }

  return { rolledOver, blocked };
}
