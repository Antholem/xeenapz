import {
  format,
  isToday,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
} from "date-fns";

export const timestamp = (
  timestampSeconds: number | undefined | null,
  isMessageMatch: boolean = false
): string | null => {
  if (!timestampSeconds || isMessageMatch) {
    return null;
  }

  const date = new Date(timestampSeconds * 1000);
  const now = new Date();
  const hoursAgo = differenceInHours(now, date);
  const daysAgo = differenceInDays(now, date);
  const weeksAgo = differenceInWeeks(now, date);

  if (hoursAgo < 24 && isToday(date)) {
    return format(date, "hh:mmaaa");
  } else if (daysAgo < 7) {
    return format(date, "EEE");
  } else if (weeksAgo < 52) {
    return format(date, "d MMM");
  } else {
    return format(date, "d MMM<ctrl98>");
  }
};
