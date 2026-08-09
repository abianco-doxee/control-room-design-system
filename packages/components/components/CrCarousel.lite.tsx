import { useStore, For, Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

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
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "viewport" · "slide" · "prev" · "next" · "dots" · "dot".
   * The active-dot accent is `--cr-carousel-dot-active` (a state, Law 2). */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* A slide carousel with the WAI-ARIA carousel pattern — a labelled region
 * (aria-roledescription="carousel"), each slide a group of "N of M", previous/next
 * controls, and optional dot indicators. The viewport is aria-live="polite" so a
 * slide change is announced; ←/→ move slides from anywhere inside. Controlled via
 * `index`/`onIndex`. Styling via .cr-carousel; data-part per part. */
export default function CrCarousel(props: CrCarouselProps) {
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
      {...ptAttrs(props.pt, "root")}
      data-part="root"
      class={ptClass(props.pt, props.unstyled, "cr-carousel", "root")}
      style={ptStyle(props.pt, props.dt, "root")}
      role="group"
      aria-roledescription="carousel"
      aria-label={props.label}
      onKeyDown={(event) => state.onKey(event)}
    >
      <div class="cr-carousel__frame">
        <button
          {...ptAttrs(props.pt, "prev")}
          type="button"
          data-part="prev"
          class={ptClass(props.pt, props.unstyled, "cr-carousel__nav cr-carousel__nav--prev", "prev")}
          aria-label="Previous slide"
          onClick={() => state.go(state.at - 1)}
        >
          <span aria-hidden="true">◂</span>
        </button>

        <div
          {...ptAttrs(props.pt, "viewport")}
          data-part="viewport"
          class={ptClass(props.pt, props.unstyled, "cr-carousel__viewport", "viewport")}
          aria-live="polite"
        >
          <For each={props.slides}>
            {(slide: CrCarouselSlide, i: number) => (
              <Show when={i === state.at}>
                <div
                  {...ptAttrs(props.pt, "slide")}
                  data-part="slide"
                  class={ptClass(props.pt, props.unstyled, "cr-carousel__slide", "slide")}
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
          {...ptAttrs(props.pt, "next")}
          type="button"
          data-part="next"
          class={ptClass(props.pt, props.unstyled, "cr-carousel__nav cr-carousel__nav--next", "next")}
          aria-label="Next slide"
          onClick={() => state.go(state.at + 1)}
        >
          <span aria-hidden="true">▸</span>
        </button>
      </div>

      <Show when={props.dots !== false && state.count > 1}>
        <div {...ptAttrs(props.pt, "dots")} data-part="dots" class={ptClass(props.pt, props.unstyled, "cr-carousel__dots", "dots")} role="tablist" aria-label={props.label + " slides"}>
          <For each={props.slides}>
            {(slide: CrCarouselSlide, i: number) => (
              <button
                {...ptAttrs(props.pt, "dot")}
                type="button"
                data-part="dot"
                data-state={i === state.at ? "active" : "inactive"}
                class={ptClass(props.pt, props.unstyled, "cr-carousel__dot", "dot")}
                role="tab"
                aria-selected={i === state.at ? "true" : "false"}
                aria-label={"Go to slide " + (i + 1)}
                tabIndex={i === state.at ? 0 : -1}
                onClick={() => state.go(i)}
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
