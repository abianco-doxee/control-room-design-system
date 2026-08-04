# Control Room — Console (Qwik example)

A real [Qwik City](https://qwik.dev) dashboard built entirely on Control Room. It
proves the whole stack composes into an app:

- the **runtime token layer** (`dist/control-room.css`) — themable via `html[data-theme]`
- the **`cr-` component classes** (`styles/components.css`) — nav rail, masthead,
  panels, breach, tags, ruler, telemetry
- the **Mitosis-compiled Qwik components** (`dist/frameworks/qwik`) — `CrButton`,
  `CrSwitch`, `CrModal`, `CrShape`, `CrSigil`, `CrChip`

It exercises the real behaviours: **live theme switching** across all four themes
(dark / light / extreme / phosphor), a **toggle** per session, the **sanctioned
Breach** (Law 9) for the one failing job, seeded **sigils** and severity **shapes**
beside colour, and a **modal** incident dialog.

## Run

```bash
npm install          # from this directory (examples/console)
npm run dev          # Qwik City dev server (SSR + resume)
npm run preview      # production build, then serve it
```

The example imports the built artifacts from the repo (`../../dist/…`), so build
the design system first from the repo root:

```bash
npm run build:tokens && npm run build:components
```

## The one integration wrinkle

The Mitosis-compiled Qwik components expose **plain** prop names (`onClick`,
`onChange`, `onClose`) — not the `$`-suffixed DOM form. Pass a QRL under the plain
name:

```tsx
<CrButton onClick={$(() => setTheme("light"))}>light</CrButton>
<CrSwitch checked={on} onChange={$((v) => (on = v))} label="live" />
```

Everything else is ordinary Qwik. See `src/routes/index.tsx` for the full
composition.
