# Project context

This directory documents the current architecture and maintenance contracts of
@samline/astro. Keep it useful to developers working on this repository.

## Reading order

1. [AGENTS.md](./AGENTS.md): development conventions.
2. [memory/project.md](./memory/project.md): purpose, source ownership and commands.
3. [lessons.md](./lessons.md): technical pitfalls that still apply.
4. [todos.md](./todos.md): current actionable project work.
5. [memory/engineering-contract.md](./memory/engineering-contract.md): installer invariants.
6. [memory/decisions.md](./memory/decisions.md): architecture boundaries.
7. [skills/README.md](./skills/README.md): relevant workflow skills.

## Focused references

- [Frontend conventions](./memory/frontend-conventions.md): UI ownership, styling and lifecycle.
- [Installer contract](./memory/modular-installer-plan.md): feature selection, locales and safe additions.
- [Updates](./memory/update-plan.md): dependency and copied-source update boundaries.
- [Website](../website/README.md) and [website conventions](../website/AGENTS.md): separate landing/docs workspace.

## Context maintenance

Store current project facts, technical constraints and decisions with a practical
reason. Update the existing contract instead of appending a task narrative.
Remove superseded rules, completed todos and abandoned plans. Keep lessons
technical and concise; integrate durable rules into their owning document.

Do not store conversations, personal statements or attribution, session summaries,
commit histories, test-run ledgers, screenshots, temporary paths or release-operation
logs. Report validation results in the relevant review or change description.
Keep reusable verification commands and unresolved technical limitations in docs.
Required legal notices and third-party licenses retain their original attribution.

Component APIs belong in src/components/<Name>/README.md. Developer documentation
is English. Version and dependency facts come from package manifests and lockfiles.

Generated projects receive scripts/agent-context and selected skills, never this
repository's maintainer context. Preserve upstream skill files, supporting files,
licenses and skills-lock.json provenance.
