import { For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
export interface CrTileItem { label: string; state: "work" | "wait" | "done" | "err" | "idle" | "stage"; }
export interface CrTilesProps {
  tiles: CrTileItem[];
  /** Extra tiles appended after the data-driven ones — a custom tile, a link, a
   *  seeded sigil. Use `.cr-tile` on your own element to keep the grid cadence. */
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "tile". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root" | "tile">;
  dt?: CrDesignTokens;
}
export default function CrTiles(props: CrTilesProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTiles"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTiles"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTiles"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return (
    <div {...ptAttrs(ptResolve(cr, props.pt, "CrTiles"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrTiles"), props.unstyled, "cr-tiles", "root")} data-part="root" style={ptStyle(ptResolve(cr, props.pt, "CrTiles"), props.dt, "root")}>
      <For each={props.tiles}>
        {(tile: CrTileItem) => <div {...ptAttrs(ptResolve(cr, props.pt, "CrTiles"), "tile")} class={ptClass(ptResolve(cr, props.pt, "CrTiles"), props.unstyled, "cr-tile cr-tile--" + tile.state, "tile")} data-part="tile" data-state={tile.state}>{tile.label}</div>}
      </For>
      {props.children}
    </div>
  );
}
