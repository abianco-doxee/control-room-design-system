import { For, Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  pt?: CrPassThrough<"item" | "link" | "root" | "separator">;
  dt?: CrDesignTokens;
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
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrBreadcrumb"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrBreadcrumb"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrBreadcrumb"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return (
    <nav aria-label={props.label || "Breadcrumb"}>
      <ol {...ptAttrs(ptResolve(cr, props.pt, "CrBreadcrumb"), "root")} data-part="root" class={ptClass(ptResolve(cr, props.pt, "CrBreadcrumb"), props.unstyled, "cr-breadcrumb", "root")} style={ptStyle(ptResolve(cr, props.pt, "CrBreadcrumb"), props.dt, "root")}>
        <For each={props.items}>
          {(crumb: CrCrumb, i: number) => (
            <li {...ptAttrs(ptResolve(cr, props.pt, "CrBreadcrumb"), "item")} data-part="item" data-state={i === props.items.length - 1 ? "current" : "inactive"} class={ptClass(ptResolve(cr, props.pt, "CrBreadcrumb"), props.unstyled, "cr-breadcrumb__item", "item")} aria-current={i === props.items.length - 1 ? "page" : undefined}>
              <Show when={i > 0}>
                <span {...ptAttrs(ptResolve(cr, props.pt, "CrBreadcrumb"), "separator")} data-part="separator" class={ptClass(ptResolve(cr, props.pt, "CrBreadcrumb"), props.unstyled, "cr-breadcrumb__separator", "separator")} aria-hidden="true">
                  {props.separator || "▸"}
                </span>
              </Show>
              <Show when={crumb.href && i !== props.items.length - 1} else={<span>{crumb.label}</span>}>
                <a {...ptAttrs(ptResolve(cr, props.pt, "CrBreadcrumb"), "link")} data-part="link" class={ptClass(ptResolve(cr, props.pt, "CrBreadcrumb"), props.unstyled, "cr-breadcrumb__link", "link")} href={crumb.href}>
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
