export interface CrInstrumentProps { children?: any; }
/** The dashboard chassis. Place <CrNav/> and a <div class="cr-instrument__board"> inside. */
export default function CrInstrument(props: CrInstrumentProps) {
  return <div class="cr-instrument">{props.children}</div>;
}
