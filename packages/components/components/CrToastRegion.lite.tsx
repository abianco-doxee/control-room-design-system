import { useStore, Show, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrToastItem {
  id: string | number;
  /** Machine signal; `err` announces assertively. */
  signal?: "work" | "wait" | "done" | "err";
  message: string;
}

/* One rendered row: a run of consecutive toasts sharing message + signal.
 * `id` is the NEWEST member's id, so dismissing removes what the user sees. */
export interface CrToastGroup {
  id: string | number;
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
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "toast" · "msg" · "count" · "close". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* A fixed anchor that stacks live toasts. The parent owns the list; each row is
 * its own live region (role=alert for err, else status) so nothing double-
 * announces. Consecutive toasts with the same message AND signal pack into one
 * row carrying an aria-hidden ×N counter — the announced text never changes, so
 * a repeat updates the count instead of re-firing the live region. The group's
 * dismiss target is the NEWEST member's id. Styling via .cr-toast-region /
 * .cr-toast.
 *
 * DO NOT add `key={g.id}` to the group loop, however tempting React's
 * "unique key" warning makes it. The no-re-announce guarantee depends on every
 * target reconciling this list POSITIONALLY, so the row's DOM node survives a
 * count bump. The group id is the NEWEST member's id and therefore changes on
 * every duplicate — keying on it would remount the row, refiring the live
 * region on each repeat. For `err` toasts (role=alert, assertive) that means
 * spamming a screen reader, which is the exact defect this design prevents. */
export default function CrToastRegion(props: CrToastRegionProps) {
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
          /* newest wins the dismiss target — onDismiss must remove the row the
           * user is actually looking at, not the oldest hidden duplicate */
          last.id = t.id;
          last.count = last.count + 1;
        } else {
          out.push({ id: t.id, signal: t.signal, message: t.message, count: 1 });
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
      {...ptAttrs(props.pt, "root")}
      data-part="root"
      class={ptClass(props.pt, props.unstyled, "cr-toast-region cr-toast-region--" + (props.position || "tr"), "root")}
      style={ptStyle(props.pt, props.dt, "root")}
    >
      <For each={state.groups()}>
        {(g: CrToastGroup) => (
          <div
            {...ptAttrs(props.pt, "toast")}
            data-part="toast"
            data-state={g.signal}
            data-count={g.count}
            class={ptClass(props.pt, props.unstyled, "cr-toast" + (g.signal ? " cr-toast--" + g.signal : ""), "toast")}
            role={g.signal === "err" ? "alert" : "status"}
            aria-live={g.signal === "err" ? "assertive" : "polite"}
          >
            <span {...ptAttrs(props.pt, "msg")} data-part="msg" class={ptClass(props.pt, props.unstyled, "cr-toast__msg", "msg")}>{g.message}</span>
            <Show when={g.count > 1}>
              {/* aria-hidden on purpose: the count is the ONLY thing that
               * changes when a duplicate arrives. Keeping it out of the live
               * region's announced text means the row updates silently instead
               * of re-announcing — critical for assertive `err` toasts. */}
              <span
                {...ptAttrs(props.pt, "count")}
                data-part="count"
                class={ptClass(props.pt, props.unstyled, "cr-toast__count", "count")}
                aria-hidden="true"
              >{state.countLabel(g)}</span>
            </Show>
            <button
              {...ptAttrs(props.pt, "close")}
              type="button"
              data-part="close"
              class={ptClass(props.pt, props.unstyled, "cr-toast__close", "close")}
              aria-label="Dismiss"
              onClick={() => props.onDismiss && props.onDismiss(g.id)}
            >
              ✕
            </button>
          </div>
        )}
      </For>
    </div>
  );
}
