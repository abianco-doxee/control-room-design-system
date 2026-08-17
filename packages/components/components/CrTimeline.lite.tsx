import { useStore, For, Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrTimelineItem {
  /** Machine time for the event (ISO or any short label; rendered verbatim). */
  time: string;
  title: string;
  detail?: string;
  /** Signal for the node marker: work · wait · done · err (Law 2). Default neutral. */
  signal?: "work" | "wait" | "done" | "err";
}

export interface CrTimelineProps {
  items: CrTimelineItem[];
  label?: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "item" · "node" · "time" · "title" · "detail".
   * The rail is chrome (`--cr-timeline-rail`); the node colour is the per-item
   * *signal* (Law 2), so it is not a per-component token. */
  unstyled?: boolean;
  pt?: CrPassThrough<"detail" | "item" | "node" | "root" | "time" | "title">;
  dt?: CrDesignTokens;
}

/* A vertical event timeline — an ordered list of moments on a rail, each with a
 * signal-coloured node, a machine time, a title and optional detail. Presentational
 * (an <ol>); the node colour is the semantic signal, never decoration. Styling via
 * .cr-timeline; data-part per part. */
export default function CrTimeline(props: CrTimelineProps) {
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
    sig(item: CrTimelineItem): string {
      return item.signal ? "cr-timeline__node--" + item.signal : "";
    },
  });

  return (
    <ol
      {...ptAttrs(ptResolve(cr, props.pt, "CrTimeline"), "root")}
      data-part="root"
      class={ptClass(ptResolve(cr, props.pt, "CrTimeline"), props.unstyled, "cr-timeline", "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrTimeline"), props.dt, "root")}
      aria-label={props.label}
    >
      <For each={props.items}>
        {(item: CrTimelineItem) => (
          <li
            {...ptAttrs(ptResolve(cr, props.pt, "CrTimeline"), "item")}
            data-part="item"
            data-signal={item.signal}
            class={ptClass(ptResolve(cr, props.pt, "CrTimeline"), props.unstyled, "cr-timeline__item", "item")}
          >
            <span
              {...ptAttrs(ptResolve(cr, props.pt, "CrTimeline"), "node")}
              data-part="node"
              aria-hidden="true"
              class={ptClass(ptResolve(cr, props.pt, "CrTimeline"), props.unstyled, "cr-timeline__node " + state.sig(item), "node")}
            />
            <div class="cr-timeline__body">
              <time
                {...ptAttrs(ptResolve(cr, props.pt, "CrTimeline"), "time")}
                data-part="time"
                class={ptClass(ptResolve(cr, props.pt, "CrTimeline"), props.unstyled, "cr-timeline__time", "time")}
                dateTime={item.time}
              >
                {item.time}
              </time>
              <span
                {...ptAttrs(ptResolve(cr, props.pt, "CrTimeline"), "title")}
                data-part="title"
                class={ptClass(ptResolve(cr, props.pt, "CrTimeline"), props.unstyled, "cr-timeline__title", "title")}
              >
                {item.title}
              </span>
              <Show when={item.detail}>
                <p
                  {...ptAttrs(ptResolve(cr, props.pt, "CrTimeline"), "detail")}
                  data-part="detail"
                  class={ptClass(ptResolve(cr, props.pt, "CrTimeline"), props.unstyled, "cr-timeline__detail", "detail")}
                >
                  {item.detail}
                </p>
              </Show>
            </div>
          </li>
        )}
      </For>
    </ol>
  );
}
