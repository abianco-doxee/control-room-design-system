// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// Support `## Heading {#custom-id}` anchors (GitHub/kramdown syntax) so the
// catalog + cross-doc links resolve to the right heading. Strips the literal
// {#id} from the rendered text and sets the heading id before rehype-slug runs.
function remarkHeadingIds() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === "heading" && node.children && node.children.length) {
        const last = node.children[node.children.length - 1];
        if (last && last.type === "text") {
          const m = last.value.match(/\s*\{#([\w-]+)\}\s*$/);
          if (m) {
            last.value = last.value.slice(0, m.index).replace(/\s+$/, "");
            node.data = node.data || {};
            node.data.hProperties = { ...(node.data.hProperties || {}), id: m[1] };
            node.data.id = m[1];
          }
        }
      }
      if (node.children) node.children.forEach(walk);
    };
    walk(tree);
  };
}

// CI injects SITE_URL + BASE_PATH for the GitHub Pages subpath (base-path aware,
// matching the Doxee Design-System-Hub convention).
const site = process.env.SITE_URL || "https://alebianco.github.io";
const base = process.env.BASE_PATH || "/control-room-design-system/";

// Astro output goes to site-dist/ so it never clobbers the token dist/.
export default defineConfig({
  site,
  base,
  outDir: "./site-dist",
  markdown: {
    remarkPlugins: [remarkHeadingIds],
  },
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
            { label: "Component Browser ↗", link: `${base}components.html`, attrs: { target: "_self" } },
          ],
        },
        {
          label: "Foundations",
          items: [
            { label: "Design Language — the 9 laws", link: "/reference/design-language/" },
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
            { label: "Seeded Pixel-Sigil", link: "/reference/seeded-sigil/" },
            { label: "Decoration — ASCII/Pixel", link: "/reference/decoration/" },
          { label: "Framework Components", link: "/reference/frameworks/" },
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
