import {
  format,
  isToday,
  differenceInWeeks,
  differenceInYears,
  isYesterday,
  differenceInHours,
  differenceInDays,
  differenceInMinutes,
  differenceInMonths,
} from "date-fns";
import { enUS } from "date-fns/locale";

const now = new Date();

export const formatPastTime = (date: Date): string => {
  const minutesAgo = differenceInMinutes(now, date);
  const hoursAgo = differenceInHours(now, date);
  const daysAgo = differenceInDays(now, date);
  const weeksAgo = differenceInWeeks(now, date);
  const monthsAgo = differenceInMonths(now, date);
  const yearsAgo = differenceInYears(now, date);

  if (minutesAgo < 1) {
    return "just now";
  } else if (minutesAgo < 60) {
    return `${minutesAgo} min${minutesAgo > 1 ? "s" : ""}`;
  } else if (hoursAgo < 24) {
    return `${hoursAgo} hr${hoursAgo > 1 ? "s" : ""}`;
  } else if (daysAgo < 7) {
    return `${daysAgo} day${daysAgo > 1 ? "s" : ""}`;
  } else if (weeksAgo < 4) {
    return `${weeksAgo} week${weeksAgo > 1 ? "s" : ""}`;
  } else if (monthsAgo < 12) {
    return `${monthsAgo} month${monthsAgo > 1 ? "s" : ""}`;
  } else {
    return `${yearsAgo} yr${yearsAgo > 1 ? "s" : ""}`;
  }
};

export const formatNormalTime = (date: Date): string => {
  const hoursAgo = differenceInHours(now, date);
  const daysAgo = differenceInDays(now, date);
  const weeksAgo = differenceInWeeks(now, date);

  if (hoursAgo < 24 && isToday(date)) {
    return format(date, "hh:mm a", { locale: enUS });
  } else if (daysAgo < 7) {
    return format(date, "EEE", { locale: enUS });
  } else if (weeksAgo < 52) {
    return format(date, "d MMM", { locale: enUS });
  } else {
    return format(date, "d MMM<ctrl3348>", { locale: enUS });
  }
};

export const formatTimestamp = (
  timestampSeconds: number | undefined | null,
  isMessageMatch: boolean = false
): string | null => {
  if (!timestampSeconds || isMessageMatch) {
    return null;
  }

  const date = new Date(timestampSeconds * 1000);

  if (differenceInDays(now, date) < 2) {
    return formatPastTime(date);
  } else {
    return formatNormalTime(date);
  }
};

export const formatDateGrouping = (
  dateString: string | undefined
): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const yearsAgo = differenceInYears(now, date);
  const weeksAgo = differenceInWeeks(now, date);

  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else if (yearsAgo >= 1) {
    return format(date, "EEE, d MMM<ctrl3348>");
  } else if (weeksAgo >= 1) {
    return format(date, "EEE, MMM d");
  } else {
    return format(date, "EEE, MMM d");
  }
};
