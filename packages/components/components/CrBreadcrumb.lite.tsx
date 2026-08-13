import { For, Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrCrumb {
  label: string;
  href?: string;
}

export interface CrBreadcrumbProps {
  items: CrCrumb[];
  label?: string;
  /** Separator drawn between crumbs. Default "▸". Always aria-hidden. */
  separator?: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "item" · "separator" · "link". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Navigation trail. The separator is a real aria-hidden element between crumbs,
 * default "▸" — the same right-pointing marker the rest of the system uses for
 * direction (List bullets, Calendar/Carousel next, the Combobox active row), and
 * unlike "/" it is not read as a path delimiter or announced as "slash". Pass
 * `separator` to override it. Rendering it in the DOM rather than a CSS
 * ::before is what makes it customisable; aria-hidden keeps a screen reader from
 * announcing it between every crumb. The last crumb is the current page
 * (aria-current). Styling via .cr-breadcrumb. */
export default function CrBreadcrumb(props: CrBreadcrumbProps) {
  return (
    <nav aria-label={props.label || "Breadcrumb"}>
      <ol {...ptAttrs(props.pt, "root")} data-part="root" class={ptClass(props.pt, props.unstyled, "cr-breadcrumb", "root")} style={ptStyle(props.pt, props.dt, "root")}>
        <For each={props.items}>
          {(crumb: CrCrumb, i: number) => (
            <li {...ptAttrs(props.pt, "item")} data-part="item" data-state={i === props.items.length - 1 ? "current" : "inactive"} class={ptClass(props.pt, props.unstyled, "cr-breadcrumb__item", "item")} aria-current={i === props.items.length - 1 ? "page" : undefined}>
              <Show when={i > 0}>
                <span {...ptAttrs(props.pt, "separator")} data-part="separator" class={ptClass(props.pt, props.unstyled, "cr-breadcrumb__separator", "separator")} aria-hidden="true">
                  {props.separator || "▸"}
                </span>
              </Show>
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
