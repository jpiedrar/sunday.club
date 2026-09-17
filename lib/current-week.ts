// The 2026 season advances every Tuesday at midnight in Costa Rica (UTC−6).
const WEEK_ONE_TUESDAY = Date.UTC(2026, 8, 8, 6);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function currentNflWeek(now: number = Date.now()): number {
  return Math.max(
    1,
    Math.min(18, Math.floor((now - WEEK_ONE_TUESDAY) / WEEK_MS) + 1),
  );
}
