# Updating Astro, dependencies and the distribution

Status: researched on 2026-10-25; proposed distribution-update commands are not
implemented. The user requested investigation of a convenient update workflow.
No dependency update, source merge, migration or publication was performed.

## Four different operations

| Operation                                          | Current supported mechanism                                             | Important boundary                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Astro and installed official @astrojs integrations | pnpm dlx @astrojs/upgrade --dry-run, then the official interactive tool | Astro owns version selection and framework migrations; review major changes               |
| Other project dependencies                         | pnpm outdated, then deliberate pnpm update/package-specific changes     | Preserve the project manager/lockfile; latest across majors is a separate decision        |
| Use the newest generator for new create/add work   | npx @samline/astro@latest after publication                             | This does not update already copied source                                                |
| Update existing copied base/components/recipes     | No automatic source updater exists today                                | Current metadata has installed paths, not the baseline contents required for safe merging |

The published official tool supports --dry-run and detects the project's manager.
It is a temporary executable, not a permanent dependency. Do not recreate its
Astro package-selection logic. Do not assume a numeric `7` argument constrains
its latest resolution; checked source resolves dist-tags and may fall back to
latest. Our distribution stays on major 7 until deliberately adopting Astro 8.

## A useful future interface

A proposed single entry point could be `npx @samline/astro update`, with scopes
for Astro, dependencies and base source. It must first show a plan; explicit
--dry-run writes nothing. These are proposal names, not commands agents may use.
Do not quietly make add/status or kit:version perform source updates.

Astro updates should invoke the official tool with the existing project manager.
Dependency updates should show current/target versions and keep major upgrades
separate. Base updates need more than replacing folders: generated source is
project-owned and may have been edited or deleted intentionally.

## Source-update prerequisites

1. Record a manifest of installed recipe versions and baseline content hashes at
   creation/add time. Retain or deterministically retrieve those exact baselines.
2. Compare original baseline, current project source and target recipe output.
   Apply unchanged-owned files safely; show three-way diffs for edits. Preserve
   custom files, secrets, translations, configuration, versions and intentional
   removals. Do not infer ownership from paths alone.
3. Detect conflicting keys/registrations and changed layouts/middleware before
   writing. Preserve rollback semantics and provide a concrete reviewable plan.
4. Do not adopt old projects or existing metadata without a deliberate migration
   that establishes trustworthy baselines. A missing hash is not permission to
   overwrite a file or to assume it matches the old release.
5. Validate schema/recipe-version changes, major boundaries, all manager/runtime
   combinations, custom files, deleted files, conflicts, dictionaries and server
   profiles. No credentials, database migrations, deployment or npm publication.

## Sources

- https://docs.astro.build/en/upgrade-astro/
- https://github.com/withastro/astro/blob/main/packages/upgrade/README.md
- https://github.com/withastro/astro/blob/main/packages/upgrade/src/actions/context.ts
- https://github.com/withastro/astro/blob/main/packages/upgrade/src/actions/verify.ts
- https://github.com/withastro/astro/blob/main/packages/upgrade/src/actions/install.ts

The official guide/tool is the authority for framework upgrades. Recheck it when
implementing; this record is not a frozen guarantee about future CLI behavior.
