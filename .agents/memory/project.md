# Project overview

@samline/astro is an independent Astro starter and modular generator for static
sites with optional Server Islands. Astro is the display name; @samline/astro
identifies the installer. The package major follows the supported Astro major;
minor and patch versions are independent. Read package.json and
packages/cli/package.json for current versions.

## Source ownership

- src/: maintained starter and full feature catalog.
- packages/cli/lib/: create/add, feature recipes, providers, static dictionary
  analysis, configuration edits and transactional application.
- scripts/prepare-package.mjs: generates packages/cli/template from explicit
  allowlists. Edit the source catalog, never the generated template.
- scripts/agent-context/: portable project guidance and memory seed.
- .agents/: repository development contracts and skills.
- website/: private landing/docs workspace, excluded from consumer output.
- tests/: authored regression and distribution checks.

Pages compose layout -> section -> reusable component. Main owns the document,
SEO, unique main landmark and shared header/navigation/footer defaults. Pages
supply metadata and content sections; slots provide exceptional overrides only.
Section-private pieces live with their section;
reusable components own a folder containing source, supporting files and README.
See decisions.md and the feature READMEs for API and security boundaries.

## Tooling and generation

Maintain the repository with pnpm for dependencies and Bun for scripts.
The CLI runs with Node through npx. Consumers independently choose npm/pnpm/Bun
for dependencies and Node/Bun for scripts. Later additions preserve current tools.
Deployment profiles cover static, Vercel, Netlify, Cloudflare Workers and Node
standalone. Public pages remain SSG; full SSR requires project configuration.

Generated projects are private, start at 0.0.1 and own their copied source.
Updating the generator does not update existing files. There is no automatic
source updater, remove command or automatic legacy-project adoption.

Only selected features, locales, dependencies and domains are emitted. The
catalog has en-us, es-mx and es-es presets; src/i18n/config.ts controls the
maintained starter's active locales. Added languages use current project keys
with empty translations and remain inactive until completed. See the installer
contract for provider, dependency, conflict and recovery rules.

## Commands

- pnpm install: install repository dependencies.
- bun run dev: start the background development server.
- bun run astro dev status / logs / stop: manage that server.
- bun run verify: formatting, i18n, Astro/TypeScript, tests and production build.
- bun run kit:prepare: regenerate and validate the installer template.
- bun run kit:pack: create a local CLI archive.
- bun run kit:version 7.x.y: coordinate root/CLI release metadata.
- bun run site:install: install the separate website workspace.
- bun run site:dev / site:verify / site:build / site:preview: website workflows.

Stop development servers before regenerating the template to avoid stale watcher
state. Local archives and generated outputs stay ignored. Release instructions
belong in RELEASING.md; package creation alone does not publish a release.

## Distribution boundaries

Keep portable .agents, selected skills, component READMEs, .env.example and
required license notices. Exclude maintainer context, website, dependencies,
reports, outputs and actual environment secrets. The original source is MIT;
third-party terms are documented in THIRD_PARTY_NOTICES.md and licenses/.

## Technical limits

Remote content, SMTP, authentication, CAPTCHA and analytics require real project
configuration. Static builds and mock providers do not establish remote behavior.
Workers SMTP and owned PostgreSQL need a compatible transport/connection strategy;
unsupported registrations remain explicit inactive examples.

The Vercel profile uses scoped dependency overrides. Package-manager overrides
cannot replace a dependency's internally bundled code; reassess bundled code when
changing the parent dependency. Bun-managed Vercel dependencies require Bun >=1.4.
Cloudflare tooling retains Node execution.

LanguagePicker and SEO share a path-based contract. Translated content with
different slugs requires a shared destination resolver; follow
src/i18n/localized-content.md before connecting a localized API/CMS.
