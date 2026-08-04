// `signal` is the canonical state vocabulary shared across the system
// (work·wait·done·err·idle·accent). `tone` is the deprecated legacy prop kept for
// back-compat (its now/later/no values still resolve via legacy CSS aliases).
export interface CrTagProps {
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent";
  /** @deprecated use `signal` */
  tone?: "now" | "work" | "later" | "no";
  children?: any;
}
export default function CrTag(props: CrTagProps) {
  return <span class={"cr-tag cr-tag--" + (props.signal || props.tone || "done")}>{props.children}</span>;
}
