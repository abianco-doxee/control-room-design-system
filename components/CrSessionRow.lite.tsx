export interface CrSessionRowProps { name: string; status: string; state: "work" | "wait" | "done" | "err" | "idle"; event?: boolean; children?: any; }
export default function CrSessionRow(props: CrSessionRowProps) {
  return (
    <div class={"cr-row" + (props.event ? " cr-row--event" : "")}>
      {props.children}
      <span class="cr-dot" role="img" aria-label={props.status} style={{ background: "var(--sig-" + props.state + ")" }} />
      <span class="cr-row__name">{props.name}</span>
      <span class="cr-row__status">{props.status}</span>
    </div>
  );
}
