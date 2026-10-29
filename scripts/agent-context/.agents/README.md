# Project agent context

This directory contains the project's conventions, persistent memory, and bundled
skills. Start here for the current project contracts.

## Reading order

1. [AGENTS.md](./AGENTS.md): coding and architecture conventions.
2. [memory/project.md](./memory/project.md): project identity, tools, and deployment.
3. [lessons.md](./lessons.md): applicable technical pitfalls.
4. [todos.md](./todos.md): current actionable work.
5. [memory/decisions.md](./memory/decisions.md): inherited and new design decisions.
6. [memory/frontend-conventions.md](./memory/frontend-conventions.md): UI ownership and example conventions.
7. [skills/README.md](./skills/README.md): skill index and provenance.

Keep current project facts, decisions and actionable tasks. Update contracts in
place and remove completed tasks, abandoned plans and superseded rules. Do not
store conversations, personal attribution, session summaries, test-run logs,
commit histories or temporary evidence. Report validation in change descriptions.
Keep secrets and unrelated project context out of memory. Preserve legal notices.

Developer documentation and memory are written in English. Component API docs
belong beside the source at src/components/<Name>/README.md.

Skills are guidance. Current user instructions and project conventions take
precedence over generic examples. Verify version-sensitive APIs against installed
versions and official documentation. Follow the user's authorized scope for
publishing, deployment, or external communications.

Keep .agents, root AGENTS.md, and skills-lock.json versioned with the project.
They are developer resources and are not public site assets. The root lockfile
records upstream skill sources; preserve upstream files when formatting.

Read memory/integrations.md for installed features, collections and pending locale translations.

Use the bundled samline-astro skill for this distribution's project workflow.

For opt-in scroll entrances, read [the reveal recipe](./memory/reveal-recipe.md).
