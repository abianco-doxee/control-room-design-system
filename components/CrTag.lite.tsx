// `signal` is the canonical state vocabulary shared across the system
// (work·wait·done·err·idle·accent).
export interface CrTagProps {
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent";
  children?: any;
}
export default function CrTag(props: CrTagProps) {
  return <span class={"cr-tag cr-tag--" + (props.signal || "done")}>{props.children}</span>;
}
