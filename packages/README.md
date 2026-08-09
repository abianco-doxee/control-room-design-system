# packages/ — workspaces (migration in progress)

Staged split per `references/monorepo-migration.md`. Packages are created here and
sources move in dependency order (tokens/utils/icons → styles → components → docs).
Until a package's sources land, its manifest is a stub; the root package still owns
the un-migrated layers. Every stage is verified green before the next.
