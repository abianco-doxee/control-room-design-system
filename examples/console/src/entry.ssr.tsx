/* SSR entry — renders the app to a stream on the server. The default theme is
 * set as a container attribute so the very first paint is themed. */
import {
  renderToStream,
  type RenderToStreamOptions,
} from "@builder.io/qwik/server";
import { manifest } from "@qwik-client-manifest";
import Root from "./root";

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, {
    manifest,
    ...opts,
    containerAttributes: {
      lang: "en",
      "data-theme": "dark",
      ...opts.containerAttributes,
    },
  });
}
