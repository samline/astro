# Updating Astro, dependencies and the distribution

Dependency updates and copied-source updates are separate operations.
No automatic distribution source updater is implemented.

## Four different operations

| Operation                                          | Current supported mechanism                                             | Important boundary                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Astro and installed official @astrojs integrations | pnpm dlx @astrojs/upgrade --dry-run, then the official interactive tool | Astro owns version selection and framework migrations; review major changes               |
| Other project dependencies                         | pnpm outdated, then deliberate pnpm update/package-specific changes     | Preserve the project manager/lockfile; latest across majors is a separate decision        |
| Use the newest generator for new create/add work   | npx @samline/astro@latest                                               | This does not update already copied source                                                |
| Update existing copied base/components/recipes     | No automatic source updater exists today                                | Current metadata has installed paths, not the baseline contents required for safe merging |

The published official tool supports --dry-run and detects the project's manager.
It is a temporary executable, not a permanent dependency. Do not recreate its
Astro package-selection logic. Do not assume a numeric `7` argument constrains
its latest resolution; checked source resolves dist-tags and may fall back to
latest. Our distribution stays on major 7 until deliberately adopting Astro 8.

## Copied-source boundary

Generated source belongs to its project. Current metadata records installed
paths without the pristine baseline contents needed for safe three-way merging.
Neither add/status nor kit:version updates existing copied source. Review upstream
changes manually against project customizations, translations and configuration;
paths alone never establish overwrite permission. Preserve deliberate deletions.

## Sources

- https://docs.astro.build/en/upgrade-astro/
- https://github.com/withastro/astro/blob/main/packages/upgrade/README.md
- https://github.com/withastro/astro/blob/main/packages/upgrade/src/actions/context.ts
- https://github.com/withastro/astro/blob/main/packages/upgrade/src/actions/verify.ts
- https://github.com/withastro/astro/blob/main/packages/upgrade/src/actions/install.ts

The official guide/tool is the authority for framework upgrades. Recheck it when
implementing; this record is not a frozen guarantee about future CLI behavior.
