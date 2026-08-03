// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// CI injects SITE_URL + BASE_PATH for the GitHub Pages subpath (base-path aware,
// matching the Doxee Design-System-Hub convention).
const site = process.env.SITE_URL || "https://alebianco.github.io";
const base = process.env.BASE_PATH || "/control-room-design-system/";

// Astro output goes to site-dist/ so it never clobbers the token dist/.
export default defineConfig({
  site,
  base,
  outDir: "./site-dist",
  integrations: [
    starlight({
      title: "Control Room",
      description:
        "A neon-noir, neobrutalist design system for dense operational dashboards.",
      customCss: ["./src/styles/starlight-theme.css"],
      pagination: false,
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/alebianco/control-room-design-system",
        },
      ],
      sidebar: [
        {
          label: "Overview",
          items: [
            { label: "What is Control Room", link: "/guide/skill/" },
            { label: "Live Gallery ↗", link: `${base}gallery.html`, attrs: { target: "_self" } },
          ],
        },
        {
          label: "Foundations",
          items: [
            { label: "Design Language — the 7 laws", link: "/reference/design-language/" },
            { label: "Tokens", link: "/reference/tokens/" },
          { label: "Tailwind-first", link: "/reference/tailwind/" },
            { label: "Motion", link: "/reference/motion/" },
            { label: "Accessibility", link: "/reference/accessibility/" },
          ],
        },
        {
          label: "Building",
          items: [
            { label: "Component Library", link: "/reference/components/" },
            { label: "Component Catalog", link: "/reference/catalog/" },
            { label: "Seeded Pixel-Cat", link: "/reference/seeded-cat/" },
          { label: "Framework Components", link: "/reference/frameworks/" },
            { label: "Figma Bridge (optional)", link: "/reference/figma-bridge/" },
            { label: "Building the Figma Kit", link: "/reference/figma-kit-build/" },
            { label: "Component Template", link: "/build/component-template/" },
            { label: "Ship Checklist", link: "/build/component-checklist/" },
          ],
        },
        {
          label: "Contributing",
          items: [
            { label: "How to contribute", link: "/guide/contributing/" },
            { label: "Changelog", link: "/guide/changelog/" },
          ],
        },
      ],
    }),
  ],
});
