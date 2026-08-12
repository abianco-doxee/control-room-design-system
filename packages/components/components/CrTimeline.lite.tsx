import { useStore, For, Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrTimelineItem {
  /** Machine time for the event (ISO or any short label; rendered verbatim). */
  time: string;
  title: string;
  detail?: string;
  /** Signal for the node marker: work · done · wait · err (Law 2). Default neutral. */
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
  pt?: any;
  dt?: any;
}

/* A vertical event timeline — an ordered list of moments on a rail, each with a
 * signal-coloured node, a machine time, a title and optional detail. Presentational
 * (an <ol>); the node colour is the semantic signal, never decoration. Styling via
 * .cr-timeline; data-part per part. */
export default function CrTimeline(props: CrTimelineProps) {
  const state = useStore({
    sig(item: CrTimelineItem): string {
      return item.signal ? "cr-timeline__node--" + item.signal : "";
    },
  });

  return (
    <ol
      {...ptAttrs(props.pt, "root")}
      data-part="root"
      class={ptClass(props.pt, props.unstyled, "cr-timeline", "root")}
      style={ptStyle(props.pt, props.dt, "root")}
      aria-label={props.label}
    >
      <For each={props.items}>
        {(item: CrTimelineItem) => (
          <li
            {...ptAttrs(props.pt, "item")}
            data-part="item"
            data-signal={item.signal}
            class={ptClass(props.pt, props.unstyled, "cr-timeline__item", "item")}
          >
            <span
              {...ptAttrs(props.pt, "node")}
              data-part="node"
              aria-hidden="true"
              class={ptClass(props.pt, props.unstyled, "cr-timeline__node " + state.sig(item), "node")}
            />
            <div class="cr-timeline__body">
              <time
                {...ptAttrs(props.pt, "time")}
                data-part="time"
                class={ptClass(props.pt, props.unstyled, "cr-timeline__time", "time")}
                dateTime={item.time}
              >
                {item.time}
              </time>
              <span
                {...ptAttrs(props.pt, "title")}
                data-part="title"
                class={ptClass(props.pt, props.unstyled, "cr-timeline__title", "title")}
              >
                {item.title}
              </span>
              <Show when={item.detail}>
                <p
                  {...ptAttrs(props.pt, "detail")}
                  data-part="detail"
                  class={ptClass(props.pt, props.unstyled, "cr-timeline__detail", "detail")}
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
