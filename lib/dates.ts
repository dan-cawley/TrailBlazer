export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function utcDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function todayUtc() {
  return new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00.000Z`);
}

export function addDays(date: Date, days: number) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function weekStart(date: Date) {
  const weekday = date.getUTCDay();
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}

export function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function monthEnd(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  return date.toLocaleDateString("en-US", { timeZone: "UTC", ...options });
}
