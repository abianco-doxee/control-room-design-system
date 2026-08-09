export interface CrBezelProps { children?: any; }
export default function CrBezel(props: CrBezelProps) {
  return (
    <div class="cr-bezel">
      <div class="cr-bezel__rivets" aria-hidden="true"><i /><i /><i /><i /></div>
      <div class="cr-bezel__screen">{props.children}</div>
    </div>
  );
}
