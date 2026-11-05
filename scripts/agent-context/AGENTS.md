# Project agent entry point

Read .agents/README.md, .agents/AGENTS.md, and .agents/memory/project.md before
working. Then consult lessons, todos, architecture decisions, and relevant skills.
Keep .agents focused on current project facts and technical contracts. Remove
stale tasks; do not store conversations, personal attribution or test-run logs.
Preserve required legal notices.

Check the bundled codebase-memory skill's CLI availability at the start of work.
If missing, ask whether the user wants to install it; never install automatically.
When installed, always use that skill for codebase inspection through MCP or its
documented CLI. Read source for coverage gaps and state runtime limits. Extracting
a skill ZIP does not install the CLI or configure agent clients.
