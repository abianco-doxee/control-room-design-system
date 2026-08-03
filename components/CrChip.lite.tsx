export interface CrChipProps { tone?: "done" | "alt"; children?: any; }
export default function CrChip(props: CrChipProps) {
  return <span class={"cr-chip" + (props.tone === "alt" ? " cr-chip--alt" : "")}>{props.children}</span>;
}
