import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";

// Qwik City (SSR + resumability) — the supported way to build a Qwik app, so
// events resume and work. Proves the Control Room Qwik target composes into a
// real app. qwikVite runs the Qwik optimizer over the app AND the imported
// compiled components in ../../dist/frameworks/qwik.
export default defineConfig({
  // this example lives inside the design-system repo; allow importing built
  // artifacts (dist/, styles/) from the repo root (two levels up).
  server: { fs: { allow: ["../.."] } },
  plugins: [qwikCity(), qwikVite()],
});
