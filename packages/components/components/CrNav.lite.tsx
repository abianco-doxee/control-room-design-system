import { For, Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, resolveMessage } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
export interface CrNavItem { label: string; href?: string; active?: boolean; badge?: string; }
export interface CrNavProps {
  brand?: string;
  items: CrNavItem[];
  /** Trailing content in the nav bar, after the item list — a user avatar, a
   *  theme switch, a status dot. Sits outside the <ul> so it stays out of the
   *  list semantics. */
  children?: any;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "brand" · "list" · "item" · "badge". */
  unstyled?: boolean;
  pt?: CrPassThrough<"badge" | "brand" | "item" | "list" | "root">;
  dt?: CrDesignTokens;
}
export default function CrNav(props: CrNavProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onMounted) props.pt.hooks.onMounted();
  });
  onUpdate(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUpdated) props.pt.hooks.onUpdated();
  }, []);
  onUnMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUnmounted) props.pt.hooks.onUnmounted();
  });

  return (
    <nav {...ptAttrs(ptResolve(cr, props.pt, "CrNav"), "root")} data-part="root" class={ptClass(ptResolve(cr, props.pt, "CrNav"), props.unstyled, "cr-nav", "root")} aria-label={resolveMessage(cr, props.labels, "CrNav", "primary")} style={ptStyle(ptResolve(cr, props.pt, "CrNav"), props.dt, "root")}>
      <Show when={props.brand}><div {...ptAttrs(ptResolve(cr, props.pt, "CrNav"), "brand")} data-part="brand" class={ptClass(ptResolve(cr, props.pt, "CrNav"), props.unstyled, "cr-nav__brand", "brand")}>{props.brand}</div></Show>
      <ul {...ptAttrs(ptResolve(cr, props.pt, "CrNav"), "list")} data-part="list" class={ptClass(ptResolve(cr, props.pt, "CrNav"), props.unstyled, "cr-nav__list", "list")}>
        <For each={props.items}>
          {(item: CrNavItem) => (
            <li>
              <a {...ptAttrs(ptResolve(cr, props.pt, "CrNav"), "item")} data-part="item" data-state={item.active ? "active" : "inactive"} class={ptClass(ptResolve(cr, props.pt, "CrNav"), props.unstyled, "cr-nav__item" + (item.active ? " cr-nav__item--active" : ""), "item")} href={item.href || "#"} aria-current={item.active ? "page" : "false"}>
                {item.label}
                <Show when={item.badge}><span {...ptAttrs(ptResolve(cr, props.pt, "CrNav"), "badge")} data-part="badge" class={ptClass(ptResolve(cr, props.pt, "CrNav"), props.unstyled, "cr-nav__badge", "badge")}>{item.badge}</span></Show>
              </a>
            </li>
          )}
        </For>
      </ul>
      {props.children}
    </nav>
  );
}
