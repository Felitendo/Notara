import {
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  addDays,
  addHours,
  nextMonday,
  isPast,
  isToday,
  isTomorrow,
  getHours,
} from "date-fns";

function setTime(date: Date, hours: number, minutes = 0): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(date, hours), minutes), 0), 0);
}

/** Returns 6pm today, or +3h rounded up to next 5min if past 3pm */
export function getLaterTodayTime(): Date | null {
  const now = new Date();
  const hour = getHours(now);

  if (hour >= 18) return null; // Already past 6pm

  if (hour >= 15) {
    // Past 3pm — use now + 3h, rounded up to next 5-minute mark
    const future = addHours(now, 3);
    const min = future.getMinutes();
    const roundedMin = Math.ceil(min / 5) * 5;
    return setTime(future, future.getHours(), roundedMin >= 60 ? 0 : roundedMin);
  }

  return setTime(now, 18);
}

/** Returns tomorrow at 8am */
export function getTomorrowMorningTime(): Date {
  return setTime(addDays(new Date(), 1), 8);
}

/** Returns tomorrow at 6pm */
export function getTomorrowEveningTime(): Date {
  return setTime(addDays(new Date(), 1), 18);
}

/** Returns next Monday at 8am */
export function getNextMondayTime(): Date {
  return setTime(nextMonday(new Date()), 8);
}

/** Check if a reminder date/time is overdue */
export function isOverdue(reminderAt: string | Date): boolean {
  const date = typeof reminderAt === "string" ? new Date(reminderAt) : reminderAt;
  return isPast(date);
}

/** Check if the device is mobile (iOS or Android) */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

interface FormatLabels {
  today: string;
  tomorrow: string;
}

/** Format a reminder date for display */
export function formatReminderLabel(date: Date, labels?: FormatLabels): string {
  const d = new Date(date);

  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday(d)) {
    return `${labels?.today ?? "Today"}, ${timeStr}`;
  }
  if (isTomorrow(d)) {
    return `${labels?.tomorrow ?? "Tomorrow"}, ${timeStr}`;
  }

  const dateStr = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });

  return `${dateStr}, ${timeStr}`;
}
