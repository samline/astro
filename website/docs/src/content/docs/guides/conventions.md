---
title: 'Project conventions'
description: 'Organize pages, sections, reusable components, translations and styles in the generated project.'
locale: en
sidebar:
  group: guides
  order: 5
---

## Compose pages from sections

The project follows **page → layout → section → reusable component**:

- `src/pages` owns routes, route data and the section instances for each page.
- `src/layouts/Main.astro` owns the document, metadata and main landmark.
- `src/sections` owns complete page areas and their specific content or behavior.
- `src/components` contains reusable pieces shared across sections.

A typical section composes `Section > Box > content components`. Section provides
semantics and vertical spacing; Box provides content width and inline gutters.
A section-specific child stays beside its section, even if it has its own file.
Reusable components keep their source, supporting scripts/styles and English
README together in one folder.

## Keep behavior with its owner

Use arrow functions by default. Keep client setup, listeners and cleanup beside
the component or section that needs them. Prefer Astro's native APIs and the
installed packages before adding another abstraction. An exception to arrow
functions should come from a real API requirement, such as Google's command
queue needing its own `arguments` object.

Choose npm, pnpm or Bun for your project dependencies and Node.js or Bun for
scripts. Keep the recorded manager, generated commands and lockfile consistent.
Later additions respect those choices. The maintainer repository uses pnpm/Bun;
that development workflow is not a requirement for consumer projects.

## Style through the shared configuration

`src/styles/tailwind.css` owns Tailwind 4 configuration and design tokens.
Use its utilities for composition and appearance, and keep component selectors
with the component when a native control or scoped behavior needs them. Use rem
for authored CSS lengths and preserve the project's responsive breakpoints,
visible focus and reduced-motion behavior. Fonts come from local Fontsource
imports.

## Put visible copy in dictionaries

Visitor-facing copy, metadata, accessible labels and feedback belong in
`src/i18n/dictionaries/<locale>/<domain>`. A domain has an `index.ts` for values
and a `types.ts` for its contract; locale indexes compose the domains.

Regular Astro components read `Astro.currentLocale` themselves. Pass the locale
explicitly across isolated server boundaries that cannot derive the parent
page's locale. Before connecting translated CMS slugs, read
`src/i18n/localized-content.md` and share the real destination mapping between
language navigation and SEO.

## Let card content determine the layout

Comparable cards start their editorial stack at the top. In a stacked image and
caption card, use an intrinsic media row and a remaining-space caption row, such
as `grid-template-rows: auto 1fr`. Reserve the image geometry and preserve its crop
and radius. A flex-column caption can pin an attribution or action group to the
bottom with `margin-block-start: auto`.

Keep this layout with the section or its private card. Avoid fixed text heights,
arbitrary minimum heights, clamping or shorter translations to hide alignment
problems. Balance editorial headings selectively. Test short and long content,
wrapped authors, long buttons and delayed provider data at 320, 390, 768 and
1440 CSS viewport widths, in both themes and at 200% text zoom. Check first rows,
action insets, image boundaries, focus, overflow and any carousel loop seam.
The generated `.agents/memory/frontend-conventions.md` contains the CSS recipe.

## Add reveal only where the section needs it

Generated projects include a copyable, opt-in recipe in
`.agents/memory/reveal-recipe.md`; it adds no mandatory animation dependency or
installed integration. See its
[complete source and acceptance matrix](https://github.com/samline/astro/blob/main/scripts/agent-context/.agents/memory/reveal-recipe.md).

Natural HTML stays visible without JavaScript. The first observer report only
prepares unseen targets still below the viewport. Initially visible or passed
content stays natural, and completed targets never replay on reverse scrolling.
The recipe uses opacity and individual translate with no default stagger, exposes
focused/hash-target content immediately, and cancels effects when reduced motion
is enabled. Its section owner disposes navigation/HMR effects and preserves
BFCache state. Deferred Server Island content needs its own explicit mount and
cleanup owner after the real content arrives.

Each animated property has one owner. Do not apply competing reveal motion to
Ticker tracks, Drawer panels, parallax targets or nested reveal ancestors. Use
the recipe's regression matrix before adapting it to a different lifecycle.

## Maintain the generated project

The copied source belongs to your project. Edit it to fit the site's requirements.
The installer can add missing integrations; future source changes from this
repository are reviewed separately. See [updating a project](../updating/) for
Astro and dependency maintenance.

Generated `.agents` contains portable conventions, selected skills and fresh
project context. Update it as decisions change. Keep component usage documentation
beside the component and keep agent context out of public assets.

These are distribution conventions. Use Astro's
[components](https://docs.astro.build/en/basics/astro-components/),
[layouts](https://docs.astro.build/en/basics/layouts/) and
[styling guide](https://docs.astro.build/en/guides/styling/)
for the underlying framework APIs.
