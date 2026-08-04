export interface CrStatusDotProps {
  signal?: "work" | "wait" | "done" | "err" | "idle";
  /** @deprecated use `signal` */
  state?: "work" | "wait" | "done" | "err" | "idle";
  label: string;
}
export default function CrStatusDot(props: CrStatusDotProps) {
  return <span class="cr-dot" role="img" aria-label={props.label} style={{ background: "var(--sig-" + (props.signal || props.state || "idle") + ")" }} />;
}
