# @samline/astro agent entry point

Before working, read .agents/README.md, then .agents/AGENTS.md and
.agents/memory/project.md. Read the technical pitfalls, current work, architecture decisions and relevant
skills listed by that index.

Keep .agents limited to current project contracts and useful technical context.
Update existing documents; remove stale tasks and superseded rules. Do not store
conversations, personal attribution, session histories or test-run logs. Preserve
required license notices and third-party attribution.

<!-- codebase-memory-mcp:start -->

For structural codebase exploration, use the installed codebase-memory skill.
The project-local copy is .agents/skills/codebase-memory/SKILL.md.
<!-- codebase-memory-mcp:end -->

<!-- samline:family:start -->

## Family conventions (@samline)

This block is synced from the template that owns the family conventions ([package-landing-docs](https://github.com/samline/package-landing-docs) `family/AGENTS.md`, `node family/scripts/sync.mjs`). Do not edit it here; change the template and re-sync. The skill `.agents/skills/samline-package/SKILL.md` carries the full rules for a repository cloned on its own.

- One package per repository. Framework-agnostic core in JS/CSS/HTML; adapters only when idiomatic, as optional peers.
- No DOM access at import time; without a DOM, calls are no-ops. Respect `prefers-reduced-motion`; content stays visible without JavaScript.
- Arrow functions and closures, no classes or `this`. `destroy()` is idempotent and restores markup.
- Zero runtime dependencies: shared primitives (`@samline/internal`, `@samline/is-visible`, `@samline/debounce`) are devDependencies bundled with `noExternal`.
- Install with pnpm, run with Bun: `pnpm install` / `pnpm add -D` (only `pnpm-lock.yaml` is committed), `bun run <script>` for everything else. Never `bun install`, `bun add`, `npm install` or `yarn`.
- Packages talk through npm only: install the published version of any sibling package. Never link or import a local checkout (`bun link`, `link:`, `file:`, path aliases, `../other-package/src`).
- Layout: `src/core`, `src/vanilla`, `src/browser/global.ts` (`window.<PascalName>`, or a plain non-colliding name such as `Strings` when that is a built-in, never a `Samline` prefix; `dist/browser/<name>.global.js`), side-effect-free `src/index.ts`. Every public entry has a gzip budget in `package.json` → `size`.
- `bun run check` must pass: format, typecheck, unit tests with coverage thresholds, build, size budgets, e2e in Chromium, Firefox and WebKit.
- README is the package guide and the site's source of truth; public text in English. Any public API change updates tests, README, docs, examples and `skills/<name>/SKILL.md` together.
- Releases: Keep a Changelog entry for every user-facing change, semver, pinned CDN URLs bumped before release. Publishing is manual (`bun run release` by the maintainer); CI never publishes; no `--provenance`.
- Public repository: no dated reports, handoff notes, transcripts or client names; private notes go in the ignored `.local/`. Site examples with state offer Reset; icons are SVG, never Unicode glyphs.
- Work skills: `npx autoskills -y -a universal`, tracked with `skills-lock.json`, minus the `bun` skill (it contradicts pnpm installs), plus `modern-web-guidance`, consulted before HTML, CSS or client-side JavaScript work.
- Always explore code through the `codebase-memory` skill and graph when `codebase-memory-mcp` is installed; read source for gaps.
- Never add AI attribution to commits, tags or pull requests.

<!-- samline:family:end -->
