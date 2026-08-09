export interface CrShapeProps {
  /** Severity / focus. Fewer sides = more danger: crit (▲3) → warn (◆4) →
   * work (⬠5) → ok (⬡6) → idle (●∞). Shape is a second channel next to colour
   * (Law 4), so severity still reads in monochrome and for colour-blind users. */
  severity: "crit" | "warn" | "work" | "ok" | "idle";
  /** Accessible name — shape/colour must never be the only carrier of meaning. */
  label?: string;
}

/** A severity glyph: the polygon's side-count encodes danger/focus. Pure CSS
 * clip-path; colour defaults to the matching signal (override with the
 * --cr-sev-fill custom property). See references/components.md#severity-shapes. */
export default function CrShape(props: CrShapeProps) {
  return (
    <span
      class={"cr-sev cr-sev--" + props.severity}
      role="img"
      aria-label={props.label || props.severity}
    />
  );
}
