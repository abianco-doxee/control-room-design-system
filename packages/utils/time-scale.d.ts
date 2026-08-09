// Types for the timezone-aware time-axis tick generator (see time-scale.js).

export interface TimeTick {
  /** tick position, epoch milliseconds. */
  value: number;
  /** rendered tick label. */
  label: string;
}

export interface TimeTicksOptions {
  /** IANA time zone the calendar boundaries are computed in (default "UTC"). */
  zone?: string;
  /** month-name language; day-first either way (default "en"). */
  locale?: "en" | "it";
  /** weekly ticks as a date ("3 Mar") or ISO week ("W10") (default "date"). */
  week?: "date" | "iso";
  /** fiscal-year anchor month, 1..12 (1 = calendar year; default 1). */
  fiscalStart?: number;
  /** desired approximate tick count (default 6). */
  target?: number;
  /** escape hatch: relabel the chosen tick positions; wins over locale/week/fiscal. */
  format?: (value: number) => string;
}

/**
 * Generate time-axis ticks between `lo` and `hi` (epoch ms). Granularity
 * auto-scales to the span: clock ticks under ~a day, then calendar day / week /
 * month / year boundaries in `opts.zone`.
 */
export function timeTicks(lo: number, hi: number, opts?: TimeTicksOptions): TimeTick[];
