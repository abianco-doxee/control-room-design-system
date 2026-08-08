---
"@control-room/design-system": minor
---

Angular runtime verification — the sixth target. Full Angular SSR isn't viable in
plain Node (its distributed packages are partially-compiled and need the Angular
build linker), so `test:frameworks` now executes the Angular component's **logic** on
the real `@angular/core`: it transpiles the component (esbuild, legacy decorators),
stubs the metadata-only `@angular/common` import, instantiates it, applies `@Input`
props, and asserts the `@Input`-driven class getter, the `@Output` `EventEmitter`,
and the `@Component` template's `cr-` markup. Harness in `build/render-fw.mjs`
(`instantiateAngular`).

With this, **all six framework targets are verified at runtime** — React (render),
Vue/Svelte/Solid (SSR render), Qwik (import), Angular (logic on @angular/core).
frameworks.md's matrix updated.
