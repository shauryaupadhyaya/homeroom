import type { TimetablePeriod } from "./types";

export const WEEKDAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

export const WEEKDAY_SHORT: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
};

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function formatTimeRange(start: string, end: string) {
  return `${start} – ${end}`;
}

export interface ScheduleStatus {
  period: TimetablePeriod;
  state: "live" | "next";
  daysAway: number;
}

/** Finds the currently-live period, or the next upcoming one across the school week. */
export function getLiveOrNextPeriod(
  timetable: TimetablePeriod[],
  now: Date
): ScheduleStatus | null {
  const weekday = now.getDay(); // 0 Sun .. 6 Sat
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (weekday >= 1 && weekday <= 5) {
    const today = timetable
      .filter((p) => p.weekday === weekday)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    const live = today.find((p) => nowMin >= toMinutes(p.start) && nowMin < toMinutes(p.end));
    if (live) return { period: live, state: "live", daysAway: 0 };

    const next = today.find((p) => toMinutes(p.start) > nowMin);
    if (next) return { period: next, state: "next", daysAway: 0 };
  }

  // roll forward to the next school day with periods
  for (let add = 1; add <= 7; add++) {
    const d = (weekday + add) % 7;
    if (d < 1 || d > 5) continue;
    const periods = timetable
      .filter((p) => p.weekday === d)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    if (periods.length > 0) {
      return { period: periods[0], state: "next", daysAway: add };
    }
  }
  return null;
}

export function todaysPeriods(timetable: TimetablePeriod[], now: Date): TimetablePeriod[] {
  const weekday = now.getDay();
  return timetable
    .filter((p) => p.weekday === weekday)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

export function isPeriodLive(p: TimetablePeriod, now: Date) {
  const weekday = now.getDay();
  if (p.weekday !== weekday) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= toMinutes(p.start) && nowMin < toMinutes(p.end);
}
