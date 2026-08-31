const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfLocalDay(ms: number = Date.now()): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function endOfLocalDay(ms: number = Date.now()): number {
  return startOfLocalDay(ms) + DAY_MS - 1;
}

export function addLocalDays(dayStart: number, days: number): number {
  const date = new Date(dayStart);
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function daysBetweenLocal(startMs: number, endMs: number): number {
  const start = new Date(startOfLocalDay(startMs));
  const end = new Date(startOfLocalDay(endMs));
  const utc1 = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utc2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((utc2 - utc1) / DAY_MS);
}

export function minutesToDate(timeMinutes: number): Date {
  const date = new Date();
  date.setHours(Math.floor(timeMinutes / 60), timeMinutes % 60, 0, 0);
  return date;
}

export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function timestampForTimeOnDay(dayStart: number, timeMinutes: number): number {
  return startOfLocalDay(dayStart) + timeMinutes * 60 * 1000;
}

export function formatTimeMinutes(timeMinutes: number): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(minutesToDate(timeMinutes));
}

export function formatDayLabel(ms: number): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(ms));
}

export function formatDateTime(ms: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ms));
}

export function eachLocalDay(fromMs: number, toMs: number): number[] {
  const days: number[] = [];
  let cursor = startOfLocalDay(fromMs);
  const end = startOfLocalDay(toMs);
  while (cursor <= end) {
    days.push(cursor);
    cursor = addLocalDays(cursor, 1);
  }
  return days;
}
