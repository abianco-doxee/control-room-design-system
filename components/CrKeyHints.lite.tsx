import { useStore, onMount, onUnMount } from "@builder.io/mitosis";

export interface CrKeyHintsProps {
  /** Hold this key to reveal every secondary key-hint at once. Default "Alt". */
  revealKey?: string;
}

/* Headless behavior: while the reveal key is held, sets data-cr-keys="on" on the
 * document root so every `.cr-kbd--hint` fades in (a "peek all shortcuts" gesture).
 * Renders nothing visible. Pair with CrKbd hint badges + aria-keyshortcuts. */
export default function CrKeyHints(props: CrKeyHintsProps) {
  const state = useStore({
    reveal() {
      document.documentElement.setAttribute("data-cr-keys", "on");
    },
    hide() {
      document.documentElement.removeAttribute("data-cr-keys");
    },
    onDown(e: KeyboardEvent) {
      if (e.key === (props.revealKey || "Alt")) {
        e.preventDefault();
        state.reveal();
      }
    },
    onUp(e: KeyboardEvent) {
      if (e.key === (props.revealKey || "Alt")) state.hide();
    },
  });

  onMount(() => {
    window.addEventListener("keydown", state.onDown);
    window.addEventListener("keyup", state.onUp);
    window.addEventListener("blur", state.hide);
  });

  onUnMount(() => {
    window.removeEventListener("keydown", state.onDown);
    window.removeEventListener("keyup", state.onUp);
    window.removeEventListener("blur", state.hide);
  });

  /* invisible but in-layout, so Qwik's visible-task (which wires the listeners)
     actually runs — a display:none host would never become "visible". */
  return (
    <span
      class="cr-keyhints"
      aria-hidden="true"
      style={{ position: "fixed", left: "0", top: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" }}
    ></span>
  );
}
