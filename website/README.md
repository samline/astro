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

Landing dev: http://127.0.0.1:4330/astro/ . Docs uses its own compiler on 4331.
Production preview serves `landing/dist`, including `/astro/docs/` and Pagefind.
The manual GitHub Pages workflow uploads that combined artifact; it does not
publish npm. Pages must use GitHub Actions before manually deploying.

## Editorial contract

Document this distribution: CLI, recipes, emitted source, conventions and local
component APIs. Link to official Astro docs for framework semantics; do not
claim Astro capabilities as our inventions. Third parties retain their own APIs.
Package commands remain explicitly marked unpublished. Never imply npm release,
a hosted integration, an official affiliation or live provider verification.
English is the website's only published language; generated sites support their
selected locales independently.

Source-backed reference pages read the current component/server READMEs and the
CLI README from the parent repository at build time. Update those authoritative
sources instead of copying their prose into a second reference tree. Guide
articles explain setup and link to Astro. `shared/data/references.json` owns the
published reference inventory. The prepared version is read from the CLI manifest.

`landing/src/i18n/translations/en/packages.ts` owns the curated personal-package
section. Add only human-requested packages with real descriptions and URLs.
Drawer and Ticker link to their websites; Forms links to npm and explicitly says
its website is coming next. The card illustrations are decorative, not runnable
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
Public copy still states that npm publication is pending. Use template mode
(noindex) only for an unadapted copy. No publication, push or deployment is implied by a
successful local build. See content-audit.json for sources and actual review limits.

Cleanup: the neutral counter, downloadable template-adaptation skill, generic
importer/adaptation runner, unused browser-framework/file-viewer/range/callout
components and their orphaned helper were removed after checking current source
imports and authored articles. Reference provenance and required licenses remain.
The style inventory records these omissions; source-backed README examples and
all currently rendered controls are preserved.
