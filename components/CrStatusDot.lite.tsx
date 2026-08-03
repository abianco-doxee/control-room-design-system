export interface CrStatusDotProps { state: "work" | "wait" | "done" | "err" | "idle"; label: string; }
export default function CrStatusDot(props: CrStatusDotProps) {
  return <span class="cr-dot" role="img" aria-label={props.label} style={{ background: "var(--sig-" + props.state + ")" }} />;
}
