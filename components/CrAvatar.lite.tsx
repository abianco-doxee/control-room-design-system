import { useStore, Show } from "@builder.io/mitosis";

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
      class={"cr-avatar" + (props.size ? " cr-avatar--" + props.size : "")}
      role={props.src ? undefined : "img"}
      aria-label={props.src ? undefined : props.name}
    >
      <Show when={props.src}>
        <img class="cr-avatar__img" src={props.src} alt={props.name} />
      </Show>
      <Show when={!props.src}>
        <span class="cr-avatar__initials" aria-hidden="true">{state.initials()}</span>
      </Show>
      <Show when={props.status}>
        <span class={"cr-avatar__status cr-avatar__status--" + props.status} role="img" aria-label={props.status}></span>
      </Show>
    </span>
  );
}
