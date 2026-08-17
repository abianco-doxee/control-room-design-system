import { onMount, onUnMount, onUpdate, useContext, useStore } from "@builder.io/mitosis";
import { ptAttrs, ptClass, ptResolve, ptStyle, resolveLocale } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  /** BCP-47 tag for the relative phrase. Falls back to the app-level `locale`
   *  from context, then "en". */
  locale?: string;
  /* ── styling contract (portable pt/dt subset). Single part: "root" (a <time>). */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* Relative-time display (e.g. "5m ago", "in 2h"). Renders a semantic <time>
 * with a machine-readable datetime; the human phrase is derived from `now`
 * (injected, never read internally — SSR-stable). Mirrors @alebianco/cr-utils/duration's
 * relativeTime. Styling: .cr-reltime; data-part="root". */
export default function CrRelativeTime(props: CrRelativeTimeProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onMounted) props.pt.hooks.onMounted();
  });
  onUpdate(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUpdated) props.pt.hooks.onUpdated();
  }, []);
  onUnMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUnmounted) props.pt.hooks.onUnmounted();
  });

  const state = useStore({
    iso(ms: number): string {
    return new Date(ms).toISOString();
    },
    /* Pick the largest unit that fits, and return [value, Intl unit name]. Unit
     * SELECTION stays ours — Intl formats a (value, unit) pair, it does not choose
     * the unit — so the d/h/m/s ladder is unchanged from the hand-rolled version. */
    pickValue(abs: number): number {
    if (abs >= 86400000) return Math.floor(abs / 86400000);
    if (abs >= 3600000) return Math.floor(abs / 3600000);
    if (abs >= 60000) return Math.floor(abs / 60000);
    return Math.max(1, Math.floor(abs / 1000));
    },
    pickUnit(abs: number): any {
    if (abs >= 86400000) return "day";
    if (abs >= 3600000) return "hour";
    if (abs >= 60000) return "minute";
    return "second";
    },
    phrase(): string {
    if (props.now === undefined || props.now === null) return state.iso(props.time).slice(0, 10);
    const delta = props.now - props.time;
    const abs = delta < 0 ? -delta : delta;
    const loc = resolveLocale(props.locale, cr && cr.locale);
    const lang = loc.split("-")[0];
    /* `narrow` keeps the terse machine register Law 8 asks for — in English it is
     * byte-identical to the previous hand-rolled output ("5m ago", "in 2h", "now").
     * A few CLDR locales render narrow as a bare +/- sign ("-5 min"), which reads
     * as a delta rather than an elapsed time; those take `short` instead. This is a
     * BEHAVIOUR table (which style reads correctly), not a translation table — no
     * per-locale copy to maintain, and an unlisted locale defaults to narrow. */
    const signOnly = lang === "fr";
    const rtf = new Intl.RelativeTimeFormat(loc, {
      numeric: "auto",
      style: signOnly ? "short" : "narrow",
    });
    /* numeric:"auto" turns 0 seconds into the locale's "now"/"ora"/"jetzt",
     * replacing the hand-written 45s "just now" threshold. */
    if (abs < 45000) return rtf.format(0, "second");
    const v = state.pickValue(abs);
    return rtf.format(delta >= 0 ? -v : v, state.pickUnit(abs));
    },
  });

  return (
    <time
      {...ptAttrs(ptResolve(cr, props.pt, "CrRelativeTime"), "root")}
      dateTime={state.iso(props.time)}
      data-part="root"
      class={ptClass(ptResolve(cr, props.pt, "CrRelativeTime"), props.unstyled, "cr-reltime", "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrRelativeTime"), props.dt, "root")}
    >
      {(props.prefix || "") + state.phrase()}
    </time>
  );
}
