import { For, Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
export interface CrNavItem { label: string; href?: string; active?: boolean; badge?: string; }
export interface CrNavProps {
  brand?: string;
  items: CrNavItem[];
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "brand" · "list" · "item" · "badge". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrNav(props: CrNavProps) {
  return (
    <nav {...ptAttrs(props.pt, "root")} data-part="root" class={ptClass(props.pt, props.unstyled, "cr-nav", "root")} aria-label="Primary" style={ptStyle(props.pt, props.dt, "root")}>
      <Show when={props.brand}><div {...ptAttrs(props.pt, "brand")} data-part="brand" class={ptClass(props.pt, props.unstyled, "cr-nav__brand", "brand")}>{props.brand}</div></Show>
      <ul {...ptAttrs(props.pt, "list")} data-part="list" class={ptClass(props.pt, props.unstyled, "cr-nav__list", "list")}>
        <For each={props.items}>
          {(item: CrNavItem) => (
            <li>
              <a {...ptAttrs(props.pt, "item")} data-part="item" data-state={item.active ? "active" : "inactive"} class={ptClass(props.pt, props.unstyled, "cr-nav__item" + (item.active ? " cr-nav__item--active" : ""), "item")} href={item.href || "#"} aria-current={item.active ? "page" : "false"}>
                {item.label}
                <Show when={item.badge}><span {...ptAttrs(props.pt, "badge")} data-part="badge" class={ptClass(props.pt, props.unstyled, "cr-nav__badge", "badge")}>{item.badge}</span></Show>
              </a>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
}
