import { Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
export interface CrEmptyStateProps { message: string; children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
/** Calm zero-data fallback (distinct from an error surface — see CrDrip). */
export default function CrEmptyState(props: CrEmptyStateProps) {
  return (
    <div {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-panel cr-panel--inset cr-empty", "root")} data-part="root" style={{ textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--muted)", margin: "0" }}>{props.message}</p>
      <Show when={props.children}>{props.children}</Show>
    </div>
  );
}
