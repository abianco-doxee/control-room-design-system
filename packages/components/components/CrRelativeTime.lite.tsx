import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrRelativeTimeProps {
  /** The moment to describe, epoch milliseconds. */
  time: number;
  /** The reference "now", epoch milliseconds — REQUIRED for a relative phrase.
   *  The clock is a prop on purpose: reading Date.now() in render would make the
   *  server and client disagree and flicker on hydration. Pass a ticking value
   *  (a store/interval) to keep it live. Omit it to render the absolute date. */
  now?: number;
  /** Rendered before the phrase, e.g. "updated ". */
  prefix?: string;
  /* ── styling contract (portable pt/dt subset). Single part: "root" (a <time>). */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Relative-time display (e.g. "5m ago", "in 2h"). Renders a semantic <time>
 * with a machine-readable datetime; the human phrase is derived from `now`
 * (injected, never read internally — SSR-stable). Mirrors @alebianco/cr-utils/duration's
 * relativeTime. Styling: .cr-reltime; data-part="root". */
export default function CrRelativeTime(props: CrRelativeTimeProps) {
  function iso(ms: number): string {
    return new Date(ms).toISOString();
  }
  function unit(abs: number): string {
    if (abs >= 86400000) return Math.floor(abs / 86400000) + "d";
    if (abs >= 3600000) return Math.floor(abs / 3600000) + "h";
    if (abs >= 60000) return Math.floor(abs / 60000) + "m";
    return Math.max(1, Math.floor(abs / 1000)) + "s";
  }
  function phrase(): string {
    if (props.now === undefined || props.now === null) return iso(props.time).slice(0, 10);
    const delta = props.now - props.time;
    const abs = delta < 0 ? -delta : delta;
    if (abs < 45000) return "just now";
    return delta >= 0 ? unit(abs) + " ago" : "in " + unit(abs);
  }

  return (
    <time
      {...ptAttrs(props.pt, "root")}
      dateTime={iso(props.time)}
      data-part="root"
      class={ptClass(props.pt, props.unstyled, "cr-reltime", "root")}
      style={ptStyle(props.pt, props.dt, "root")}
    >
      {(props.prefix || "") + phrase()}
    </time>
  );
}
