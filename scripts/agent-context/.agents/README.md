# Project agent context

This directory contains the project's conventions, persistent memory, and bundled
skills. Start here when opening a new chat or recovering context.

## Reading order

1. [AGENTS.md](./AGENTS.md): coding and architecture conventions.
2. [memory/project.md](./memory/project.md): project identity, tools, and deployment.
3. [lessons.md](./lessons.md): project-specific corrections and preferences.
4. [todos.md](./todos.md): explicitly requested pending work.
5. [memory/decisions.md](./memory/decisions.md): inherited and new design decisions.
6. [skills/README.md](./skills/README.md): skill index and provenance.

Record confirmed decisions and lessons as work progresses. Add pending tasks
only when the user requests or defers them. Keep environment values, credentials,
private logs, and unrelated project context out of memory.

Developer documentation and memory are written in English. Component API docs
belong beside the source at src/components/<Name>/README.md.

Skills are guidance. Current user instructions and project conventions take
precedence over generic examples. Verify version-sensitive APIs against installed
versions and official documentation. Follow the user's authorized scope for
publishing, deployment, or external communications.

Keep .agents, root AGENTS.md, and skills-lock.json versioned with the project.
They are developer resources and are not public site assets. The root lockfile
records upstream skill sources; preserve upstream files when formatting.
