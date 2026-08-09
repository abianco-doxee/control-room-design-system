import { useStore, Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrAvatarProps {
  /** Person / entity name — the accessible name, and the source of the initials
   *  fallback when there's no image. */
  name: string;
  /** Image URL. When absent (or it fails to load) the initials show instead. */
  src?: string;
  /** Presence dot: "online" · "idle" · "busy" · "offline". */
  status?: string;
  /** Size token: "sm" · "lg" (default medium). */
  size?: string;
  /* ── styling contract (portable pt/dt subset) — parts: "root" · "img" · "initials" · "status". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Avatar — an image with an initials fallback. With a src it's an <img alt=name>;
 * without one the wrapper becomes role=img with aria-label=name and shows the
 * initials (aria-hidden, so they're not double-announced). An optional presence
 * dot is a labelled role=img. Styling via .cr-avatar. */
export default function CrAvatar(props: CrAvatarProps) {
  const state = useStore({
    initials(): string {
      const parts = (props.name || "").trim().split(/\s+/);
      const first = parts[0] ? parts[0][0] : "";
      const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
      const out = (first + last).toUpperCase();
      return out || "?";
    },
  });

  return (
    <span
      {...ptAttrs(props.pt, "root")}
      class={ptClass(props.pt, props.unstyled, "cr-avatar" + (props.size ? " cr-avatar--" + props.size : ""), "root")}
      data-part="root"
      style={ptStyle(props.pt, props.dt, "root")}
      role={props.src ? undefined : "img"}
      aria-label={props.src ? undefined : props.name}
    >
      <Show when={props.src}>
        <img {...ptAttrs(props.pt, "img")} class={ptClass(props.pt, props.unstyled, "cr-avatar__img", "img")} data-part="img" src={props.src} alt={props.name} />
      </Show>
      <Show when={!props.src}>
        <span {...ptAttrs(props.pt, "initials")} class={ptClass(props.pt, props.unstyled, "cr-avatar__initials", "initials")} data-part="initials" aria-hidden="true">{state.initials()}</span>
      </Show>
      <Show when={props.status}>
        <span {...ptAttrs(props.pt, "status")} class={ptClass(props.pt, props.unstyled, "cr-avatar__status cr-avatar__status--" + props.status, "status")} data-part="status" role="img" aria-label={props.status}></span>
      </Show>
    </span>
  );
}
