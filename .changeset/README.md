# Changesets

This folder holds **changesets** — small Markdown files describing changes and
the version bump they warrant. This is how releases work here.

## The flow

1. Made a user-facing change? Add a changeset:
   ```bash
   npm run changeset
   ```
   Pick the bump (**patch** = token tweak / fix, **minor** = new token/component/
   theme, **major** = renamed/removed token or a changed law), and write a
   one-line summary. Commit the generated `.changeset/*.md` with your PR.

2. On merge to `main`, the **Release** workflow opens (or updates) a
   **"Version Packages"** PR that consumes the changesets: bumps `version` in
   `package.json` and prepends the entries to `CHANGELOG.md`.

3. Merge that PR to cut the release (a git tag / GitHub release). This package is
   **private**, so there is no npm publish step.

See https://github.com/changesets/changesets for the full docs.
