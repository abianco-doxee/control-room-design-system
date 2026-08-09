/* Pass-through (pt) / design-token (dt) / unstyled styling helpers shared by every
 * component adopting the styling contract (CrTabs, CrMenu, CrModal, …). Pure
 * functions of the component's props — no reactivity, no framework primitives —
 * so they compile and ship uniformly across all six targets. See
 * references/styling-contract.md. */

/** base class gated by `unstyled`, with the part's pt class merged in. */
export function ptClass(pt: any, unstyled: boolean, base: string, part: string): string {
  const p = pt && pt[part];
  return ((unstyled ? "" : base) + (p && p.class ? " " + p.class : "")).trim();
}

/** the part's pt bag minus class/style — spread onto the element as extra
 *  attributes / handlers (class + style are applied separately). */
export function ptAttrs(pt: any, part: string): any {
  const p = pt && pt[part];
  if (!p) return {};
  const out: any = { ...p };
  delete out.class;
  delete out.style;
  return out;
}

/** part style: dt custom-properties on the root part, plus any pt style. */
export function ptStyle(pt: any, dt: any, part: string): any {
  const p = pt && pt[part];
  const base = part === "root" ? dt || {} : {};
  return { ...base, ...(p && p.style ? p.style : {}) };
}
