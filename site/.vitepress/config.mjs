import { defineConfig } from "vitepress";

// Docs source is the repo root, so the reference Markdown is published as-is
// (single source of truth — no copies). The gallery is a self-contained page
// in site/public, served at /gallery.html.
export default defineConfig({
  srcDir: "..",
  srcExclude: ["**/node_modules/**", "dist/**", "build/**", "site/**", "**/README.md"],
  title: "Control Room",
  description:
    "Control Room — a neon-noir, neobrutalist design system for dense operational dashboards.",
  base: "/control-room-design-system/",
  cleanUrls: true,
  ignoreDeadLinks: true, // reference links are repo-relative (SKILL/skill usage), not site paths
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: "Guide", link: "/SKILL" },
      { text: "Design Language", link: "/references/design-language" },
      { text: "Components", link: "/references/components" },
      { text: "Live Gallery", link: "/gallery.html", target: "_self" },
    ],
    sidebar: [
      {
        text: "Overview",
        items: [
          { text: "What is Control Room", link: "/SKILL" },
          { text: "Live Gallery ↗", link: "/gallery.html", target: "_self" },
        ],
      },
      {
        text: "Foundations",
        items: [
          { text: "Design Language — the 7 laws", link: "/references/design-language" },
          { text: "Tokens", link: "/references/tokens" },
          { text: "Motion", link: "/references/motion" },
          { text: "Accessibility", link: "/references/accessibility" },
        ],
      },
      {
        text: "Building",
        items: [
          { text: "Component Library", link: "/references/components" },
          { text: "Seeded Pixel-Cat", link: "/references/seeded-cat" },
          { text: "Component Template", link: "/templates/component" },
          { text: "Ship Checklist", link: "/checklists/component-checklist" },
        ],
      },
      {
        text: "Contributing",
        items: [
          { text: "How to contribute", link: "/CONTRIBUTING" },
          { text: "Changelog", link: "/CHANGELOG" },
        ],
      },
    ],
    outline: { level: [2, 3] },
    search: { provider: "local" },
  },
});
