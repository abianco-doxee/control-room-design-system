import { Show } from "@builder.io/mitosis";
export interface CrEmptyStateProps { message: string; children?: any; }
/** Calm zero-data fallback (distinct from an error surface — see CrDrip). */
export default function CrEmptyState(props: CrEmptyStateProps) {
  return (
    <div class="cr-panel cr-panel--inset" style={{ textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--muted)", margin: "0" }}>{props.message}</p>
      <Show when={props.children}>{props.children}</Show>
    </div>
  );
}
