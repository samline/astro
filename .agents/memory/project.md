# Project state

Last reconciled: 2026-10-23.

## Purpose and layout

Astro Kit is a new Astro 7 base for SSG sites with Server Islands, using Vercel
by default. The old Astro 5 project is a reference for intent, not an implementation
to copy. Dinkbit is a reference for breakpoints and consent presentation.

The application lives directly at the repository root, not in a nested scaffold.
Pages compose layout -> section -> reusable component. Each reusable component
owns its source, English README, and supporting files inside src/components/<Name>.
Section-only pieces stay beside their owning section.

## Versions and distribution

- Root and CLI version: 7.14.0.
- Astro dependency: ^7.4.2; use Astro 7.4 behavior and current official docs.
- Tailwind CSS 4 via its Vite plugin; TypeScript 6 and Vite 8.
- Install with pnpm; execute project scripts with Bun.
- Repository: git@github.com:samline/astro-kit.git; current branch main.
- Latest source commit before memory migration: 2059917.
- Prior feature commits: d9f3d8f (GTM/consent/themes), cb62214 (UI primitives/themes).

The public generator is @samline/astro-kit and must run through npx with Node.
It independently falls back to npm when pnpm or Bun is unavailable. Preserve
all four tool combinations. The deploy prompt supports static, Vercel, Netlify,
Cloudflare Workers, and custom Node standalone. Full SSR is future-project setup.

packages/cli/template is generated from an explicit allowlist. Never edit it
manually or copy the workspace wholesale. Generated projects are private,
start at 0.0.1, and do not change when the generator is updated. The kit keeps
major 7 until adopting Astro 8; minor and patch versions are independent of
Astro's minor number. No npm publication is authorized yet.

## Implemented base

- Modular en-us dictionaries; en-mx is prepared but commented out (English for Mexico).
- SEO, social metadata, JSON-LD, robots, sitemap, and shared indexing policy.
- Public img, docs, and video directories retained with .gitkeep.
- Section, Box, Link, Button, H, FaIcon, LanguagePicker, SEO, Theme, GTM, and PageLoader components.
- CSS-first Tailwind configuration, local Fontsource Inter, and a focused normalize.
- Astro-site accent colors: blue #3245ff, purple #bc52ee, pink #f041ff, with light/dark derivatives.
- Deferred CookieConsent and independent analytics/marketing permissions.
- Theme initialization/switch API and ldrs-based PageLoader.
- English component API docs and package tests that preserve their distribution.

See memory/decisions.md for the component contracts and tradeoffs.

## Commands

Install dependencies with pnpm install. Run scripts with Bun:

- bun run dev: start the background Astro development server.
- bun run astro dev status / logs / stop: manage that server.
- bun run verify: formatting, i18n, Astro/TypeScript, tests, and SSG build.
- bun run kit:prepare: regenerate the installer template.
- bun run kit:pack: validate and create a local tarball; does not publish.
- bun run kit:version 7.x.y: advance matching root and CLI versions.

Last source validation before this migration: 55 tests passed, no Astro/TS
errors, warnings, or hints, production build and local package checks passed.
Do not reuse that statement as evidence for later untested source changes.

## Validation limits and local tooling

A production build or localhost preview is not a deployed production site.
GTM tests used temporary process environment variables with a fake container ID;
real Google tags, deployed tracking, and PageSpeed results were not validated.
Use a real container and Tag Assistant only when the project provides them.
Never claim local testing proves remote provider behavior.

Remove temporary preview routes and sections before final validation/packaging.
Stop development servers before kit:prepare, verify, or kit:pack: regenerating
the template can disturb Astro watchers and leave stale server records. If a
background server reports running but connections fail, inspect its status/logs
and restart the stale local server.

## Memory boundary

.agents contains conventions, decisions, lessons, todos, and project skills.
Root AGENTS.md is a short entry point. Keep environment secrets out of memory,
logs, packages, and documentation. Preserve skills-lock.json provenance.

## Portable agent distribution

New projects receive root AGENTS.md, a clean .agents seed, and selected skill
folders with provenance. The seed source is scripts/agent-context; never copy
this maintainer memory wholesale. packages/cli/lib/agents.mjs declares the file
and skill allowlists and renders project-specific tool/deployment instructions.

Baseline skills: accessibility, Astro, Bun, codebase-memory, frontend design,
SEO, Tailwind, TypeScript, and Vite. Add deploy-to-vercel only for the Vercel
profile. Exclude backend-specific skills from the site template. Preserve skill
references/license files and filter the root skills-lock.json accordingly.

Initial project lessons and todos are empty. Do not copy the kit publication
backlog, commits, old-project references, or environment values. Package validation
rejects agent paths outside the seed allowlist and unselected skill folders.

Portable-context validation for 7.14.0: 56 tests passed, Astro/TypeScript and SSG
build passed, and tarball generation preserved the selected upstream skill files.
Tests covered all provider/tool combinations, fresh project memory, provenance,
Vercel-only skill selection, and rejection of unexpected agent history/skills.
The extracted tarball also generated a buildable project with formatted context.

## Button primitive

Button owns src/components/Button with an English README. It is a minimal
Tailwind primitive: primary/secondary variants, sm/md/lg sizes, and no client
runtime or built-in label. Without href it renders a native button, defaulting
to type=button; with href it delegates to Link for locale and rel handling.
Native disabled is button-only; typed props separate actions from navigation.
Labels come from the calling section dictionary. NotFound uses its link mode.
Keep this API small so future projects can establish their own design.

## Heading primitive

H owns src/components/H with an English README. Require level 1 through 6,
render a native heading through a typed tag map, and reject invalid levels at
render time. Forward native HTML and Astro scope attributes, use a default slot,
and keep content in dictionaries. No children:any, client script, empty CSS,
automatic outline inference, or imposed typography. Choose semantic level from
the document hierarchy and visual styles with class. Welcome and NotFound use H.

## Font Awesome primitive

FaIcon owns src/components/FaIcon and renders imported IconDefinition data as
native SVG during Astro rendering. Import individual free Solid/Regular/Brands
definitions, preferably deep imports; do not register full packs, use dom.watch,
or ship Font Awesome runtime/font/CDN assets to the browser. The four installed
Font Awesome packages were checked against registry latest: 7.3.1 on 2026-10-23.
The common-types dependency is type-only; SVG Core is unnecessary here.

Use icon={faArrowLeft}, not a name string or lib prop. Default icons are
decorative; optional nonempty translated label exposes role=img and aria-label.
Name icon-only controls on the control itself and keep their child icon hidden.
Geometry comes from the definition; default height is 1em with proportional width,
currentColor fill, and native dimension overrides. CSS utilities style the SVG.
Multiple paths render with one fill; FA transforms/animation and commercial
duotone styling are outside this primitive. NotFound uses a decorative arrow.
