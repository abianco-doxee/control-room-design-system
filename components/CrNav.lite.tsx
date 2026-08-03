import { For, Show } from "@builder.io/mitosis";
export interface CrNavItem { label: string; href?: string; active?: boolean; badge?: string; }
export interface CrNavProps { brand?: string; items: CrNavItem[]; }
export default function CrNav(props: CrNavProps) {
  return (
    <nav class="cr-nav" aria-label="Primary">
      <Show when={props.brand}><div class="cr-nav__brand">{props.brand}</div></Show>
      <ul class="cr-nav__list">
        <For each={props.items}>
          {(item: CrNavItem) => (
            <li>
              <a class={"cr-nav__item" + (item.active ? " cr-nav__item--active" : "")} href={item.href || "#"} aria-current={item.active ? "page" : "false"}>
                {item.label}
                <Show when={item.badge}><span class="cr-nav__badge">{item.badge}</span></Show>
              </a>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
}
