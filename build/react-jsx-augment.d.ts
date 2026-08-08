// React JSX augmentation for the compiled-output type-check (build/tsconfig.frameworks.json).
//
// CrForm delegates field input through listeners on the <form>. Most delegated
// events (input/change/click/keydown/mousedown, and blur/focus) are in React's
// JSX types and bubble in React. But blur/focus do NOT bubble on the other five
// targets, so CrForm ALSO attaches `onFocusOut`/`onFocusIn` (which DO bubble as
// native events) for them. React ignores those two props at runtime — it uses the
// bubbling onBlur/onFocus we also attach — but its shipped types don't declare
// them, so tsc would flag the compiled React output. Declaring them here (only in
// the frameworks type-check scope) keeps the guard honest without loosening it.
// See references/forms.md → "Per-field re-render isolation".
import "react";

declare module "react" {
  interface DOMAttributes<T> {
    onFocusOut?: (event: any) => void;
    onFocusIn?: (event: any) => void;
  }
}
