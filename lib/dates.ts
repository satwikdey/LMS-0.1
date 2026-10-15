/**
 * Date helpers. All business dates are calendar dates in Asia/Kolkata, stored in
 * Postgres `date` columns. In JS they are represented as Date objects at 00:00:00Z of
 * that calendar day, so they round-trip through Prisma without timezone drift.
 */
export const SCHOOL_TZ = "Asia/Kolkata";

const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar date (YYYY-MM-DD) of an instant, as seen in Asia/Kolkata. */
export function istDateString(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHOOL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
  return parts; // en-CA yields YYYY-MM-DD
}

export function parseDate(s: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`Invalid date: ${s}`);
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    throw new Error(`Invalid date: ${s}`);
  }
  return d;
}

/** Today in Asia/Kolkata as a date-only Date. */
export function todayIST(now: Date = new Date()): Date {
  return parseDate(istDateString(now));
}

export function isoDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return (typeof d === "string" ? new Date(d) : d).toISOString().slice(0, 10);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d.getTime());
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

export function addMonths(d: Date, months: number): Date {
  const r = new Date(d.getTime());
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, lastDay));
  return r;
}

export function addYears(d: Date, years: number): Date {
  return addMonths(d, years * 12);
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

/** ISO weekday: Monday = 1 … Sunday = 7. */
export function isoWeekday(d: Date): number {
  const w = d.getUTCDay();
  return w === 0 ? 7 : w;
}

export function eachDay(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function formatDateDisplay(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeDisplay(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: SCHOOL_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Compare matching elapsed periods year-on-year.
 * Returns the previous-year window covering exactly the same calendar span.
 */
export function previousYearWindow(from: Date, to: Date): { from: Date; to: Date } {
  return { from: addYears(from, -1), to: addYears(to, -1) };
}

/**
 * Academic-year mode: window = [yearStart, min(asOf, yearEnd)]; the comparison window is the
 * previous year's start plus the same number of elapsed days.
 */
export function elapsedWindows(
  current: { start: Date; end: Date },
  previous: { start: Date; end: Date } | null,
  asOf: Date,
) {
  const to = asOf < current.end ? asOf : current.end;
  const elapsed = Math.max(0, diffDays(to, current.start));
  const cur = { from: current.start, to };
  const prev = previous
    ? {
        from: previous.start,
        to: (() => {
          const t = addDays(previous.start, elapsed);
          return t < previous.end ? t : previous.end;
        })(),
      }
    : null;
  return { cur, prev, elapsedDays: elapsed };
}
