import { For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
export interface CrTileItem { label: string; state: "work" | "wait" | "done" | "err" | "idle" | "stage"; }
export interface CrTilesProps {
  tiles: CrTileItem[];
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "tile". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrTiles(props: CrTilesProps) {
  return (
    <div {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-tiles", "root")} data-part="root" style={ptStyle(props.pt, props.dt, "root")}>
      <For each={props.tiles}>
        {(tile: CrTileItem) => <div {...ptAttrs(props.pt, "tile")} class={ptClass(props.pt, props.unstyled, "cr-tile cr-tile--" + tile.state, "tile")} data-part="tile" data-state={tile.state}>{tile.label}</div>}
      </For>
    </div>
  );
}
