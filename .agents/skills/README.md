# Project skills

Read the relevant SKILL.md before applying a workflow.

| Skill                                                             | Source                              |
| ----------------------------------------------------------------- | ----------------------------------- |
| [accessibility](./accessibility/SKILL.md)                         | addyosmani/web-quality-skills       |
| [astro](./astro/SKILL.md)                                         | astrolicious/agent-skills           |
| [deploy-to-vercel](./deploy-to-vercel/SKILL.md)                   | vercel-labs/agent-skills            |
| [frontend-design](./frontend-design/SKILL.md)                     | anthropics/skills                   |
| [nodejs-backend-patterns](./nodejs-backend-patterns/SKILL.md)     | wshobson/agents                     |
| [nodejs-best-practices](./nodejs-best-practices/SKILL.md)         | sickn33/antigravity-awesome-skills  |
| [seo](./seo/SKILL.md)                                             | addyosmani/web-quality-skills       |
| [tailwind-css-patterns](./tailwind-css-patterns/SKILL.md)         | giuseppe-trisciuoglio/developer-kit |
| [typescript-advanced-types](./typescript-advanced-types/SKILL.md) | wshobson/agents                     |
| [vite](./vite/SKILL.md)                                           | antfu/skills                        |
| [codebase-memory](./codebase-memory/SKILL.md)                     | DeusData/codebase-memory-mcp        |

The graph skill requires the configured codebase-memory MCP tools. If the
service is unavailable, inspect source directly and state the coverage limit.

The root skills-lock.json belongs to autoskills and retains source hashes.
The local codebase-memory copy is separate from registry-managed entries. Preserve upstream skill files when formatting project docs.

Project conventions override generic examples: Astro 7.4, SSG/Server Islands,
pnpm installs, Bun execution, arrows, modular dictionaries, English developer
docs and component ownership.

## Original project skills

- [samline-astro](./samline-astro/SKILL.md): build and maintain a generated project using its installed features, dictionaries, ownership and update boundaries. Shipped with generated projects.
- [samline-astro-maintainer](./samline-astro-maintainer/SKILL.md): maintain this repository's CLI, catalog, package and website. Repository-only; not installed in consumer projects.

- [samline-project-kickoff](./samline-project-kickoff/SKILL.md): prepare a project and an evidence-backed design inventory. Includes an English prompt and inventory contract; shipped with generated projects.

These three skills are original MIT-licensed project source. They are not registry
entries and must not receive fabricated autoskills hashes. Third-party licenses
and notices are retained in ../../licenses/skills and THIRD_PARTY_NOTICES.md.
Runtime conventions live in project instructions and the project workflow skills.
