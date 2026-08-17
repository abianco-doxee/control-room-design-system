import { useStore, Show, For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrToastItem {
  id: string | number;
  /** Machine signal; `err` announces assertively. */
  signal?: "work" | "wait" | "done" | "err";
  message: string;
}

/* One rendered row: a run of consecutive toasts sharing message + signal.
 *
 * TWO ids, deliberately kept apart — collapsing them into one field is a real
 * accessibility bug, not a style preference:
 *  - `id`        IDENTITY. The OLDEST (first) member's id, so it is STABLE while
 *                the run grows. Mitosis auto-derives React/Qwik `key={g.id}`
 *                from a field named `id`, so this is the field the reconciler
 *                keys on — it must never change on a count bump, or the row
 *                remounts and refires its live region.
 *  - `newestId`  DISMISS TARGET. The NEWEST member's id, so `onDismiss` removes
 *                the toast the user is actually looking at. */
export interface CrToastGroup {
  id: string | number;
  newestId: string | number;
  signal?: "work" | "wait" | "done" | "err";
  message: string;
  count: number;
}

export interface CrToastRegionProps {
  toasts: CrToastItem[];
  /** Anchor: tr (default) · br · tl · bl · tc · bc · ml · mr · mc. Bottom
   * anchors stack newest nearest the edge. */
  position?: "tr" | "br" | "tl" | "bl" | "tc" | "bc" | "ml" | "mr" | "mc";
  onDismiss?: (id: string | number) => void;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "toast" · "msg" · "count" · "close". */
  unstyled?: boolean;
  pt?: CrPassThrough<"close" | "count" | "msg" | "root" | "toast">;
  dt?: CrDesignTokens;
}

/* A fixed anchor that stacks live toasts. The parent owns the list; each row is
 * its own live region (role=alert for err, else status) so nothing double-
 * announces. Consecutive toasts with the same message AND signal pack into one
 * row carrying an aria-hidden ×N counter — the announced text never changes, so
 * a repeat updates the count instead of re-firing the live region. The group's
 * dismiss target is the group's `newestId`. Styling via .cr-toast-region /
 * .cr-toast.
 *
 * The no-re-announce guarantee needs the row's DOM node to SURVIVE a count bump
 * rather than remount — a remounted role=alert refires, and for `err` toasts
 * (assertive) that spams a screen reader. So the row's identity must be stable
 * while a run grows. That is why CrToastGroup carries TWO ids: `id` is the
 * OLDEST member's (stable identity), while `newestId` is the dismiss target.
 * Mitosis emits no key for this loop today, so the targets reconcile
 * positionally and the guarantee already holds — but the design deliberately
 * does not RELY on that codegen detail: `id` is stable so that a reconciler
 * which DOES key on it keys on something that never changes. Never key this
 * loop on `newestId`, and never reassign `id` when a duplicate merges. Guarded
 * by tests/cross-fw-contract.test.mjs across all six targets. */
export default function CrToastRegion(props: CrToastRegionProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrToastRegion"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrToastRegion"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrToastRegion"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const state = useStore({
    /* Collapse runs of consecutive same-message/same-signal toasts. Only
     * CONSECUTIVE ones pack, so an unrelated toast in between keeps the two
     * occurrences visually separate and preserves arrival order. */
    groups(): CrToastGroup[] {
      const out: CrToastGroup[] = [];
      const list = props.toasts || [];
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        const last = out.length > 0 ? out[out.length - 1] : null;
        if (last && last.message === t.message && last.signal === t.signal) {
          /* newest wins the DISMISS TARGET — onDismiss must remove the row the
           * user is actually looking at, not the oldest hidden duplicate.
           * `last.id` (identity) is deliberately NOT touched: it stays the
           * oldest member's id so the row's reconciliation key is stable and
           * the live region is patched rather than remounted. */
          last.newestId = t.id;
          last.count = last.count + 1;
        } else {
          out.push({ id: t.id, newestId: t.id, signal: t.signal, message: t.message, count: 1 });
        }
      }
      return out;
    },
    /* Built as ONE string rather than "×" + {g.count} in the markup: the
     * multiplication sign and the number must not be split across text nodes,
     * or the JSX indentation leaks a stray space into some targets. */
    countLabel(g: CrToastGroup): string {
      return "×" + g.count;
    },
  });

  return (
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrToastRegion"), "root")}
      data-part="root"
      class={ptClass(ptResolve(cr, props.pt, "CrToastRegion"), props.unstyled, "cr-toast-region cr-toast-region--" + (props.position || "tr"), "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrToastRegion"), props.dt, "root")}
    >
      <For each={state.groups()}>
        {(g: CrToastGroup) => (
          <div
            {...ptAttrs(ptResolve(cr, props.pt, "CrToastRegion"), "toast")}
            data-part="toast"
            data-state={g.signal}
            data-count={g.count}
            class={ptClass(ptResolve(cr, props.pt, "CrToastRegion"), props.unstyled, "cr-toast" + (g.signal ? " cr-toast--" + g.signal : ""), "toast")}
            role={g.signal === "err" ? "alert" : "status"}
            aria-live={g.signal === "err" ? "assertive" : "polite"}
          >
            <span {...ptAttrs(ptResolve(cr, props.pt, "CrToastRegion"), "msg")} data-part="msg" class={ptClass(ptResolve(cr, props.pt, "CrToastRegion"), props.unstyled, "cr-toast__msg", "msg")}>{g.message}</span>
            <Show when={g.count > 1}>
              {/* aria-hidden on purpose: the count is the ONLY thing that
               * changes when a duplicate arrives. Keeping it out of the live
               * region's announced text means the row updates silently instead
               * of re-announcing — critical for assertive `err` toasts. */}
              <span
                {...ptAttrs(ptResolve(cr, props.pt, "CrToastRegion"), "count")}
                data-part="count"
                class={ptClass(ptResolve(cr, props.pt, "CrToastRegion"), props.unstyled, "cr-toast__count", "count")}
                aria-hidden="true"
              >{state.countLabel(g)}</span>
            </Show>
            <button
              {...ptAttrs(ptResolve(cr, props.pt, "CrToastRegion"), "close")}
              type="button"
              data-part="close"
              class={ptClass(ptResolve(cr, props.pt, "CrToastRegion"), props.unstyled, "cr-toast__close", "close")}
              aria-label={resolveMessage(cr, props.labels, "CrToastRegion", "dismiss")}
              onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrToastRegion'), 'close', 'onClick', event); props.onDismiss && props.onDismiss(g.newestId); }}
            >
              ✕
            </button>
          </div>
        )}
      </For>
    </div>
  );
}
