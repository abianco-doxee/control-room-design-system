import { For } from "@builder.io/mitosis";
export interface CrTileItem { label: string; state: "work" | "wait" | "done" | "err" | "idle" | "stage"; }
export interface CrTilesProps { tiles: CrTileItem[]; }
export default function CrTiles(props: CrTilesProps) {
  return (
    <div class="cr-tiles">
      <For each={props.tiles}>
        {(tile: CrTileItem) => <div class={"cr-tile cr-tile--" + tile.state}>{tile.label}</div>}
      </For>
    </div>
  );
}
