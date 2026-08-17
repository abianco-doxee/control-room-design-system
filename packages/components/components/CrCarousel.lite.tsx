import { useStore, For, Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptAttrs, ptClass, ptHandler, ptResolve, ptStyle, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrCarouselSlide {
  title: string;
  caption?: string;
}

export interface CrCarouselProps {
  slides: CrCarouselSlide[];
  /** Current slide index (controlled). Default 0. */
  index?: number;
  label: string;
  onIndex?: (index: number) => void;
  /** Show the dot indicators. Default true. */
  dots?: boolean;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "viewport" · "slide" · "prev" · "next" · "dots" · "dot".
   * The active-dot accent is `--cr-carousel-dot-active` (a state, Law 2). */
  unstyled?: boolean;
  pt?: CrPassThrough<"dot" | "dots" | "next" | "prev" | "root" | "slide" | "viewport">;
  dt?: CrDesignTokens;
}

/* A slide carousel with the WAI-ARIA carousel pattern — a labelled region
 * (aria-roledescription="carousel"), each slide a group of "N of M", previous/next
 * controls, and optional dot indicators. The viewport is aria-live="polite" so a
 * slide change is announced; ←/→ move slides from anywhere inside. Controlled via
 * `index`/`onIndex`. Styling via .cr-carousel; data-part per part. */
export default function CrCarousel(props: CrCarouselProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCarousel"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCarousel"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCarousel"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const state = useStore({
    get count(): number {
      return props.slides ? props.slides.length : 0;
    },
    get at(): number {
      const i = props.index && props.index > 0 ? props.index : 0;
      return i > state.count - 1 ? Math.max(0, state.count - 1) : i;
    },
    go(i: number) {
      const n = state.count;
      if (n === 0) return;
      const wrapped = (i + n) % n;
      if (props.onIndex) props.onIndex(wrapped);
    },
    onKey(event: any) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        state.go(state.at + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        state.go(state.at - 1);
      }
    },
  });

  return (
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrCarousel"), "root")}
      data-part="root"
      class={ptClass(ptResolve(cr, props.pt, "CrCarousel"), props.unstyled, "cr-carousel", "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrCarousel"), props.dt, "root")}
      role="group"
      aria-roledescription="carousel"
      aria-label={props.label}
      onKeyDown={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCarousel'), 'root', 'onKeyDown', event); state.onKey(event); }}
    >
      <div class="cr-carousel__frame">
        <button
          {...ptAttrs(ptResolve(cr, props.pt, "CrCarousel"), "prev")}
          type="button"
          data-part="prev"
          class={ptClass(ptResolve(cr, props.pt, "CrCarousel"), props.unstyled, "cr-carousel__nav cr-carousel__nav--prev", "prev")}
          aria-label={resolveMessage(cr, props.labels, "CrCarousel", "prevSlide")}
          onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCarousel'), 'prev', 'onClick', event); state.go(state.at - 1); }}
        >
          <span aria-hidden="true">◂</span>
        </button>

        <div
          {...ptAttrs(ptResolve(cr, props.pt, "CrCarousel"), "viewport")}
          data-part="viewport"
          class={ptClass(ptResolve(cr, props.pt, "CrCarousel"), props.unstyled, "cr-carousel__viewport", "viewport")}
          aria-live="polite"
        >
          <For each={props.slides}>
            {(slide: CrCarouselSlide, i: number) => (
              <Show when={i === state.at}>
                <div
                  {...ptAttrs(ptResolve(cr, props.pt, "CrCarousel"), "slide")}
                  data-part="slide"
                  class={ptClass(ptResolve(cr, props.pt, "CrCarousel"), props.unstyled, "cr-carousel__slide", "slide")}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={i + 1 + " of " + state.count}
                >
                  <span class="cr-carousel__title">{slide.title}</span>
                  <Show when={slide.caption}>
                    <span class="cr-carousel__caption">{slide.caption}</span>
                  </Show>
                </div>
              </Show>
            )}
          </For>
        </div>

        <button
          {...ptAttrs(ptResolve(cr, props.pt, "CrCarousel"), "next")}
          type="button"
          data-part="next"
          class={ptClass(ptResolve(cr, props.pt, "CrCarousel"), props.unstyled, "cr-carousel__nav cr-carousel__nav--next", "next")}
          aria-label={resolveMessage(cr, props.labels, "CrCarousel", "nextSlide")}
          onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCarousel'), 'next', 'onClick', event); state.go(state.at + 1); }}
        >
          <span aria-hidden="true">▸</span>
        </button>
      </div>

      <Show when={props.dots !== false && state.count > 1}>
        <div {...ptAttrs(ptResolve(cr, props.pt, "CrCarousel"), "dots")} data-part="dots" class={ptClass(ptResolve(cr, props.pt, "CrCarousel"), props.unstyled, "cr-carousel__dots", "dots")} role="tablist" aria-label={props.label + " slides"}>
          <For each={props.slides}>
            {(slide: CrCarouselSlide, i: number) => (
              <button
                {...ptAttrs(ptResolve(cr, props.pt, "CrCarousel"), "dot")}
                type="button"
                data-part="dot"
                data-state={i === state.at ? "active" : "inactive"}
                class={ptClass(ptResolve(cr, props.pt, "CrCarousel"), props.unstyled, "cr-carousel__dot", "dot")}
                role="tab"
                aria-selected={i === state.at ? "true" : "false"}
                aria-label={resolveMessage(cr, props.labels, "CrCarousel", "goToSlide", i + 1)}
                tabIndex={i === state.at ? 0 : -1}
                onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCarousel'), 'dot', 'onClick', event); state.go(i); }}
              >
                <span aria-hidden="true">{i === state.at ? "●" : "○"}</span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
