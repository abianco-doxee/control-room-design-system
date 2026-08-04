import { For, Show } from "@builder.io/mitosis";

export interface CrCrumb {
  label: string;
  href?: string;
}

export interface CrBreadcrumbProps {
  items: CrCrumb[];
  label?: string;
}

/* Navigation trail. ASCII "/" separators come from CSS; the last crumb is the
 * current page (aria-current). Styling via .cr-breadcrumb. */
export default function CrBreadcrumb(props: CrBreadcrumbProps) {
  return (
    <nav aria-label={props.label || "Breadcrumb"}>
      <ol class="cr-breadcrumb">
        <For each={props.items}>
          {(crumb: CrCrumb, i: number) => (
            <li class="cr-breadcrumb__item" aria-current={i === props.items.length - 1 ? "page" : undefined}>
              <Show when={crumb.href && i !== props.items.length - 1} else={<span>{crumb.label}</span>}>
                <a class="cr-breadcrumb__link" href={crumb.href}>
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
