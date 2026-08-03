export interface CrTagProps { tone?: "now" | "work" | "later" | "no"; children?: any; }
export default function CrTag(props: CrTagProps) {
  return <span class={"cr-tag cr-tag--" + (props.tone || "now")}>{props.children}</span>;
}
