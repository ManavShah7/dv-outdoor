import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Indian digit grouping — 12,34,567 rather than 1,234,567. */
export function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/**
 * A "YYYY-MM-DD" lease date is a calendar date, not an instant. `new Date(iso)`
 * parses it as UTC midnight and then renders it in local time, which shifts it
 * to the previous day anywhere west of Greenwich. Build it as a local date
 * instead — on a lease contract an off-by-one day is a real error.
 */
export function parseDateOnly(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function shortDate(iso: string) {
  return parseDateOnly(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function fullDate(iso: string) {
  return parseDateOnly(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysUntil(iso: string) {
  const end = parseDateOnly(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}
