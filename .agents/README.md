# @samline/astro agent context

This directory is the persistent project memory and local skill library.
Read it when starting work or recovering context after a chat reset.

## Reading order

1. [AGENTS.md](./AGENTS.md): project conventions and working rules.
2. [memory/project.md](./memory/project.md): purpose, current state, commands, and validation limits.
3. [lessons.md](./lessons.md): confirmed user preferences and corrections.
4. [todos.md](./todos.md): explicitly requested pending or deferred work.
5. [memory/engineering-contract.md](./memory/engineering-contract.md): shared
   philosophy, ownership, installer invariants and evidence requirements.
6. [memory/decisions.md](./memory/decisions.md): architectural decisions relevant to the task.
7. [skills/README.md](./skills/README.md): choose relevant skills, then read their SKILL.md.

## Frontend and updates

- [Frontend conventions](./memory/frontend-conventions.md): explicit preferences,
  cross-project evidence, ownership decisions and legacy practices to avoid.
- [Update investigation](./memory/update-plan.md): official Astro update tools,
  dependency/source boundaries and requirements for a future base updater.

## Reference analyses

- [Fields migration analysis](./memory/fields-analysis.md): EasyTrip and Astro 5
  findings, Astro boundaries and validation requirements. Migration implemented in
  src/components/Fields; see its README for the current API.

- [Migration inventory](./memory/migration-inventory.md): comparison with current
  Astro 5 source, covered capabilities and remaining candidates. Analysis only.

- [Helpers and branch review](./memory/helpers-branches-review.md): Astro 5 main
  helpers and breaking-changes findings, tested defects and candidate decisions.
  The user paused component migrations; this is analysis, not a new backlog.

- [Branch adoption](./memory/branch-adoption.md): selected 7.17.0 integrations,
  package ownership, exclusions and validation evidence.

- [Modular installer plan](./memory/modular-installer-plan.md): requested feature
  selection, locales, later additions, dependency boundaries and validation.
  Implemented in 7.20.0; read project.md for actual validation and limits.

## Package website

See [website/README.md](../website/README.md) and [website/AGENTS.md](../website/AGENTS.md)
for the private landing/docs workspace and its editorial/distribution contract.

## Maintenance

Update the relevant file when a user establishes a convention, a correction
produces a lesson, or an explicit request creates or completes a pending item.
Record evidence and remaining limits without claiming unperformed validation.
Do not invent backlog items from suggestions or possible improvements.

Human and task instructions take precedence over installed skill advice. Check
installed dependency versions and official documentation when guidance depends
on framework versions. Skills do not authorize deployment or publication.

Maintainer context stays in this repository's .agents directory. Generated
projects receive a portable seed from scripts/agent-context plus selected skills.
Their lessons and todos start fresh, and tools/deployment settings are rendered
by the installer. Agent files are developer context, not public site assets.
Component API documentation belongs in src/components/<Name>/README.md and is
included in generated projects.

## Skill provenance

Autoskills 0.4.1 was run with npx on 2026-10-23. It installed 11 project-scoped
skills under .agents/skills. The root skills-lock.json is maintained by the
installer and records their sources and hashes; keep it at its standard path.
The existing codebase-memory skill is also copied here for structural queries.
The noncommercial Bun skill was later removed during license review; original
project skills now document runtime and maintenance workflows.
Do not reformat upstream skill files when updating project documentation.

Audit findings and verification: [2026-10-26 audit](./memory/audit-2026-10-26.md).
