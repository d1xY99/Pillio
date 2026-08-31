export function tzFromQuery(value: string | undefined) {
  const n = Number(value ?? '0');
  return Number.isFinite(n) ? n : 0;
}

export function rangeFromQuery(fromRaw: string | undefined, toRaw: string | undefined, tzOffsetMin: number) {
  const now = Date.now();
  const from = Number(fromRaw);
  const to = Number(toRaw);
  return {
    from: Number.isFinite(from) ? from : now,
    to: Number.isFinite(to) ? to : now,
    tzOffsetMin,
  };
}
