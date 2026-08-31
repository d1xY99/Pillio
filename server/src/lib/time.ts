const DAY_MS = 24 * 60 * 60 * 1000;

/** Client `Date.getTimezoneOffset()`: minutes to add to local to get UTC. */
export function localDate(ms: number, tzOffsetMin: number) {
  return new Date(ms - tzOffsetMin * 60 * 1000);
}

export function localWeekday(ms: number, tzOffsetMin: number) {
  return localDate(ms, tzOffsetMin).getUTCDay();
}

export function startOfClientDay(ms: number, tzOffsetMin: number) {
  const local = localDate(ms, tzOffsetMin);
  local.setUTCHours(0, 0, 0, 0);
  return local.getTime() + tzOffsetMin * 60 * 1000;
}

export function endOfClientDay(ms: number, tzOffsetMin: number) {
  return startOfClientDay(ms, tzOffsetMin) + DAY_MS - 1;
}

export function addClientDays(dayStart: number, days: number, tzOffsetMin: number) {
  return startOfClientDay(dayStart + days * DAY_MS + 12 * 60 * 60 * 1000, tzOffsetMin);
}

export function daysBetweenClient(startMs: number, endMs: number, tzOffsetMin: number) {
  const start = startOfClientDay(startMs, tzOffsetMin);
  const end = startOfClientDay(endMs, tzOffsetMin);
  return Math.round((end - start) / DAY_MS);
}

export function timestampForTimeOnDay(dayStart: number, timeMinutes: number) {
  return dayStart + timeMinutes * 60 * 1000;
}

export function eachClientDay(fromMs: number, toMs: number, tzOffsetMin: number) {
  const days: number[] = [];
  let cursor = startOfClientDay(fromMs, tzOffsetMin);
  const end = startOfClientDay(toMs, tzOffsetMin);
  while (cursor <= end) {
    days.push(cursor);
    cursor = addClientDays(cursor, 1, tzOffsetMin);
  }
  return days;
}
