// isExternalHref(href) — is this link off-site?
//
// A navigating control should render a real <a> (middle-click, copy-link,
// status-bar preview) and, when it points off-site, get target="_blank" +
// rel="noopener noreferrer". Detect that robustly with the URL parser rather than
// a `startsWith("http")` guess — the latter misfires on protocol-relative (`//x`),
// mailto:, and same-origin absolute URLs. Ported from dp-tooling.
//
//   import { isExternalHref, externalAttrs } from "@control-room/design-system/href";

export function isExternalHref(href) {
  if (!href || typeof href !== "string") return false;
  // in-page / relative / non-navigational schemes are never "external tabs"
  if (/^(#|\/(?!\/)|\.|\?)/.test(href)) return false;
  if (/^(mailto:|tel:|sms:)/i.test(href)) return false;
  try {
    // Resolve against the current origin when available; fall back to a base so
    // this is safe in SSR/Node where `location` is undefined.
    const base = typeof location !== "undefined" ? location.href : "http://localhost/";
    const url = new URL(href, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (typeof location === "undefined") return /^[a-z][\w+.-]*:\/\//i.test(href); // absolute → treat as external in SSR
    return url.origin !== location.origin;
  } catch {
    return false;
  }
}

// The attributes an external link should carry. Spread onto the <a>.
export function externalAttrs(href) {
  return isExternalHref(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

export default isExternalHref;
