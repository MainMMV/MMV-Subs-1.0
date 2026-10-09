/** Compare Tashkent wall-clock values so a sleeping free service can catch up. */
export function dueWithinLookback(
  target: { date: string; time: string },
  current: { date: string; time: string },
  lookbackMinutes = 24 * 60,
): boolean {
  const scheduledAt = Date.parse(`${target.date}T${target.time}:00Z`);
  const currentAt = Date.parse(`${current.date}T${current.time}:00Z`);
  if (!Number.isFinite(scheduledAt) || !Number.isFinite(currentAt)) return false;
  const elapsed = currentAt - scheduledAt;
  return elapsed >= 0 && elapsed < lookbackMinutes * 60_000;
}
