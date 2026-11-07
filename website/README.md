# Astro distribution website

The private website for `@samline/astro`, embedded separately from the maintained
starter source. Adapted from samline/package-landing-docs at
`dd6d8892339690487099aab1246b2b01005df335`. Its visual reference remains Ticker at
`8a30c9ca8486953fdc2801f0ceff8b17d0cb5615`; see REFERENCE.md and UPSTREAM.md.
Template MIT attribution: TEMPLATE-LICENSE.md; font licenses stay with the fonts.

From the repository root: `bun run site:install`, `bun run site:dev`,
`bun run site:verify`, `bun run site:preview`. Dependencies use an independent
pnpm workspace/lock; execution uses Bun, with Node required by external tools.
The root starter scripts and runtime are unchanged.

The asset preparation step derives the kickoff prompt and standalone skill ZIP
in `docs/public/downloads/` from `.agents/skills/samline-project-kickoff/` at the
repository root. Edit that source rather than the generated downloads. Building
requires the `zip` command; the download integrity test also uses `unzip`.
It also derives a Codebase Memory ZIP from .agents/skills/codebase-memory,
including its retained upstream MIT license. Neither archive bundles a runtime
executable or installs agent configuration. The downloads belong to website output; the CLI ships the original skill
directly and continues to exclude website source and tools.

Landing dev: http://127.0.0.1:4330/astro/ . Docs uses its own compiler on 4331.
Production preview serves `landing/dist`, including `/astro/docs/` and Pagefind.
The GitHub Pages workflow validates and deploys that combined artifact on every
push to main, and also supports manual runs. It does not publish npm. Configure
Pages to use GitHub Actions.

## Editorial contract

Document this distribution: CLI, recipes, emitted source, conventions and local
component APIs. Link to official Astro docs for framework semantics; do not
claim Astro capabilities as our inventions. Third parties retain their own APIs.
Use the public npm installer as the primary onboarding flow. Keep local archive
testing as a contributor workflow. Do not imply official affiliation or claim
that external providers have been validated by source installation.
English is the website's only published language; generated sites support their
selected locales independently.

Source-backed reference pages read the current component/server READMEs and the
CLI README from the parent repository at build time. Update those authoritative
sources instead of copying their prose into a second reference tree. Guide
articles explain setup and link to Astro. `shared/data/references.json` owns the
published reference inventory. The package version is read from the CLI manifest.

`landing/src/i18n/translations/en/packages.ts` owns the curated personal-package
section. Add only human-requested packages with real descriptions and URLs.
Drawer, Ticker, Notify and Forms link to their published websites and documentation. The card illustrations are decorative, not runnable
package demos. Do not auto-discover packages or add unsupported promotion.

## Distribution and validation

The website never belongs in the CLI tarball or generated projects. Preserve
root/CLI allowlists, `.npmignore`, `.gitignore`, required portable `.agents` and
pack tests together. Generated favicon/font licenses, build output, caches,
reports, screenshots and node_modules stay ignored. Do not ignore authored docs,
source fonts/licenses, tests or the pnpm lockfile.

`bun run verify` here checks configuration, protected template styles, both app
types, formatting, source tests, a combined build/link audit and browser checks.
Use each route in both themes, narrow/enlarged/no-JS views, keyboard, reduced
motion, copying, search and menu lifecycle. No upstream score is this site's score.
The adapted site uses `site.template:false` after the content/release review.
Public copy uses the standard installation flow without prerelease notices. Use
template mode (noindex) only for an unadapted copy. No publication, push or deployment is implied by a
successful local build. See content-audit.json for sources and actual review limits.

Cleanup: the neutral counter, downloadable template-adaptation skill, generic
importer/adaptation runner, unused browser-framework/file-viewer/range/callout
components and their orphaned helper were removed after checking current source
imports and authored articles. Reference provenance and required licenses remain.
The style inventory records these omissions; source-backed README examples and
all currently rendered controls are preserved.

## Shared identity convention

The canonical package-landing-docs identity policy owns the common README roles,
`<subject> — <npm name>` document/social title composition and explicit footer
credit. site.credit is samline; npm author/license attribution remains separate.
check:identity runs during verify and release on the combined artifact, including
source-backed articles and their copyright footer. Home and Examples share all
footer resources, with the Astro framework reference retained as a local addition.
The Astro skill link opens the workflow guide and its canonical ZIP downloads.

The root and published CLI READMEs follow the same section/table roles as sibling packages. Its
Installation uses npx/pnpm dlx/bunx, API describes the CLI, skills have real source
and download destinations, and License links the actual LICENSE filename. It has
no fictitious CDN build. Contributor workflows live in CONTRIBUTING.md. The
README scaffold retained under scripts/ is checker test evidence; the website
has no restored generic importer. Keep these intentional installer differences
when porting template checks. Docs recipes already display their real commands
inline; the website has no neutral Field component to patch.

The curated-package destination makes this header a seven-item menu. Its 64rem–80rem
desktop range uses scoped 0.375rem link insets and 0.125rem gaps alongside the canonical compact
version/GitHub treatment; preserve all destinations and test the actual name.
