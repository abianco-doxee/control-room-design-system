import { For, Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrCrumb {
  label: string;
  href?: string;
}

export interface CrBreadcrumbProps {
  items: CrCrumb[];
  label?: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "item" · "link". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Navigation trail. ASCII "/" separators come from CSS; the last crumb is the
 * current page (aria-current). Styling via .cr-breadcrumb. */
export default function CrBreadcrumb(props: CrBreadcrumbProps) {
  return (
    <nav aria-label={props.label || "Breadcrumb"}>
      <ol {...ptAttrs(props.pt, "root")} data-part="root" class={ptClass(props.pt, props.unstyled, "cr-breadcrumb", "root")} style={ptStyle(props.pt, props.dt, "root")}>
        <For each={props.items}>
          {(crumb: CrCrumb, i: number) => (
            <li {...ptAttrs(props.pt, "item")} data-part="item" data-state={i === props.items.length - 1 ? "current" : "inactive"} class={ptClass(props.pt, props.unstyled, "cr-breadcrumb__item", "item")} aria-current={i === props.items.length - 1 ? "page" : undefined}>
              <Show when={crumb.href && i !== props.items.length - 1} else={<span>{crumb.label}</span>}>
                <a {...ptAttrs(props.pt, "link")} data-part="link" class={ptClass(props.pt, props.unstyled, "cr-breadcrumb__link", "link")} href={crumb.href}>
                  {crumb.label}
                </a>
              </Show>
            </li>
          )}
        </For>
      </ol>
    </nav>
  );
}
