import { component$ } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";

/* The two Control Room stylesheets — the runtime token layer (themable via
 * html[data-theme]) and the cr- component classes. Everything visual comes
 * from here; the components carry only structure + state + a11y. */
import "@alebianco/cr-tokens/css";
import "@alebianco/cr-styles/components";

const FOUC = `(function(){try{var t=localStorage.getItem('cr-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Control Room — Console</title>
        {/* FOUC guard — apply the persisted theme before styles paint. */}
        <script dangerouslySetInnerHTML={FOUC} />
      </head>
      <body>
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});
