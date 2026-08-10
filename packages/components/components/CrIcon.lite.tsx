import { useStore } from "@builder.io/mitosis";
import { PIXEL_ICONS } from "../lib/icons/pixel.ts";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

/* Control Room icon set — the house operational glyphs.
 *
 * CONTRACT: 24×24 viewBox, single stroke weight (2), `currentColor`, no fill,
 * square caps + miter joins (hard-edged, to match the neobrutalist geometry).
 * Size on the space grid via `size` (default 20). Decorative by default
 * (aria-hidden); pass `label` to expose it as an image with an accessible name.
 *
 * Add an icon = add one entry to the path map below (keep it a single `d`, square
 * geometry). The map lives in a useStore getter so the Mitosis codegen keeps it.
 *
 * `set` picks the pack: "cr" (default — the hand-authored geometric identity set,
 * stroked) or "pixel" (the softer pixel-art escape hatch built from Iconify's
 * pixelarticons, filled). Both are single-<path> on a 24×24 grid, so they render
 * portably on all six targets. A theme/app opts a subtree into the soft style with
 * <CrIcon set="pixel" />. Pixel falls back to the house glyph if a name is absent. */
export interface CrIconProps {
  name: string;
  size?: number;
  label?: string;
  /** Icon pack: "cr" (geometric, default) · "pixel" (soft pixel-art escape hatch). */
  set?: "cr" | "pixel";
  /** Escape hatch: a raw single-`<path>` `d` string. When set it renders as-is,
   * overriding `name`/`set` — feed any glyph from any Iconify family (import a map
   * from @abianco-doxee/cr-icons and pass map[name]) or a hand-drawn 24×24 path,
   * with no rebuild of this package. Stroked like the house set unless `filled`. */
  path?: string;
  /** With `path`: render it filled (fill=currentColor, no stroke), like the pixel pack. */
  filled?: boolean;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrIcon(props: CrIconProps) {
  const state = useStore({
    get d(): string {
      const paths: Record<string, string> = {
        play: "M8 5 L19 12 L8 19 Z",
        pause: "M9 5 V19 M15 5 V19",
        stop: "M6 6 H18 V18 H6 Z",
        retry: "M20 6 V11 H15 M20 11 A8 8 0 1 0 18 16",
        deploy: "M12 16 V4 M7 9 L12 4 L17 9 M5 20 H19",
        scan: "M4 4 H9 M4 4 V9 M20 4 H15 M20 4 V9 M4 20 H9 M4 20 V15 M20 20 H15 M20 20 V15 M4 12 H20",
        search: "M11 4 A7 7 0 1 0 11 18 A7 7 0 1 0 11 4 M16 16 L21 21",
        alert: "M12 3 L22 20 H2 Z M12 9 V14 M12 16 V17",
        error: "M12 3 A9 9 0 1 0 12 21 A9 9 0 1 0 12 3 M8 8 L16 16 M16 8 L8 16",
        done: "M4 12 L10 18 L20 6",
        clock: "M12 3 A9 9 0 1 0 12 21 A9 9 0 1 0 12 3 M12 7 V12 L16 14",
        cpu: "M7 7 H17 V17 H7 Z M10 4 V7 M14 4 V7 M10 17 V20 M14 17 V20 M4 10 H7 M4 14 H7 M17 10 H20 M17 14 H20",
        logs: "M5 6 H19 M5 10 H19 M5 14 H15 M5 18 H12",
        filter: "M4 5 H20 L14 12 V19 L10 17 V12 Z",
        sliders: "M4 8 H20 M9 5 V11 M4 16 H20 M15 13 V19",
        close: "M6 6 L18 18 M18 6 L6 18",
        chevron: "M6 9 L12 15 L18 9",
        plus: "M12 5 V19 M5 12 H19",
        minus: "M5 12 H19",
        trash: "M5 7 H19 M9 7 V4 H15 V7 M7 7 L8 20 H16 L17 7",
        external: "M14 4 H20 V10 M20 4 L11 13 M18 14 V19 H5 V6 H10",
        copy: "M9 9 H20 V20 H9 Z M4 15 V4 H15",
        session: "M12 5 A3 3 0 1 0 12 11 A3 3 0 1 0 12 5 M6 20 V18 A6 6 0 0 1 18 18 V20",
        menu: "M4 7 H20 M4 12 H20 M4 17 H20",
      };
      if (props.path) return props.path;
      if (props.set === "pixel") return PIXEL_ICONS[props.name] || paths[props.name] || "";
      return paths[props.name] || "";
    },
    get pixel(): boolean {
      if (props.path) return !!props.filled;
      return props.set === "pixel" && !!PIXEL_ICONS[props.name];
    },
  });

  return (
    <svg
      {...ptAttrs(props.pt, "root")}
      class={ptClass(props.pt, props.unstyled, "cr-icon", "root")}
      data-part="root"
      style={ptStyle(props.pt, props.dt, "root")}
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      data-set={state.pixel ? "pixel" : "cr"}
      fill={state.pixel ? "currentColor" : "none"}
      stroke={state.pixel ? "none" : "currentColor"}
      stroke-width="2"
      stroke-linecap="square"
      stroke-linejoin="miter"
      role={props.label ? "img" : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : "true"}
    >
      <path d={state.d} />
    </svg>
  );
}
