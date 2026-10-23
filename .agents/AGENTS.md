## Package manager and runtime

Install and manage dependencies exclusively with pnpm. Use `pnpm install`
(or `pnpm install --frozen-lockfile` in CI) and keep `pnpm-lock.yaml` updated.
Run project scripts with Bun: `bun run dev`, `bun run build`, and
`bun run preview`. The scripts explicitly use the Bun runtime.

The published CLI is the exception: it must run through npx without requiring
Bun or pnpm. Generated projects prefer pnpm for installs and Bun for execution,
but independently fall back to npm for either missing tool. Adapt generated
scripts, packageManager, install hooks, README and Vercel config together.
Never silently install global tools. Test all four combinations.

Keep the working Astro base at the repository root. `packages/cli/template`
is generated from an explicit allowlist by `bun run kit:prepare`, never edited
manually. Root and CLI versions match Astro's major (currently 7). Run
`bun run kit:version 7.x.y` for a release and test `bun run kit:pack` locally.

## Internationalization

Every visitor-facing string belongs in `src/i18n/dictionaries`: page copy,
metadata, accessible labels, alt text, validation messages and loading/error
states. Do not hardcode UI text or put translated copy in environment variables.
Split every locale into domain directories (common, forms, buttons, site, etc.).
Every domain has index.ts for translations and types.ts for its contract. Locale
indexes only compose modules; never put all strings or field types in one file.
Define each module contract in en-us and reexport it in en-mx to prevent drift.
Use the typed dictionary in Astro, and pass the current locale explicitly to
Server Islands because their request URL is not the parent page URL.

Prefer native `astro:i18n` URL helpers and `Astro.currentLocale`; do not add a
custom routing layer for behavior Astro already provides. Keep `getStaticPaths`
with the dynamic page that requires it. Pass locale-free paths to URL helpers.

`src/i18n/config.ts` is the source of truth for active locales. Default: en-us;
en-mx is prepared but commented out (English for Mexico, not Spanish).
`bun run check:i18n` checks visible literals in Astro markup. It is a guard,
not data-flow analysis: keep browser script messages in dictionaries too.

## UI hierarchy and layout primitives

Pages compose layout -> section -> component. Use `src/layouts/Main.astro`
for the document, SEO and the unique main landmark. Pages contain section
instances, route/data logic and metadata; do not leave UI markup, CSS or browser
scripts directly in route files. Domain sections live in `src/sections`, next
to `components`, and compose reusable components. Components do not import
sections or layouts. Regular Astro components read Astro.currentLocale directly;
only pass locale explicitly across an isolated boundary that needs it.

`src/components/Section/index.astro` is the semantic section wrapper, NOT a content
width container. Require a unique id and label it using a real heading where
appropriate. It owns vertical rhythm: padding-block is 2.5rem, 4rem at 48rem,
and 5rem at 64rem. padded=false removes its default spacing. Customize with
--section-padding-block and --section-scroll-offset. It may contain several
Box instances or full-width content; do not automatically insert a Box into it.

`src/components/Box/index.astro` is a centered content-width container, NOT a card or
semantic section. It uses full available width, a 90rem maximum and 1.25rem
inline gutters. size='narrow' uses 48rem for forms or focused content;
size='wide' uses 120rem; size='fluid' removes the maximum.
Use a single size prop instead of the old x2/liquid booleans. Override dimensions
with --box-max-width and --box-gutter. Do not add vertical spacing or decoration.

The usual domain-section composition is Section > Box > content components.
Both primitives use native Astro HTMLAttributes, slots, logical CSS properties
and class:list, forward rest attributes (including Astro scope attributes), and
consume custom props instead of leaking them to the DOM. Do not add children:any,
loose any prop signatures, client JavaScript or Tailwind just for these wrappers.
All visible copy stays in the dictionaries.

## PageLoader

Keep PageLoader in `src/components/PageLoader` and mount it inside Main's body.
Retain ldrs: the user wants to swap animation icons easily. Keep the selected
animation import, registration and custom element together in index.astro;
use Tailwind for the overlay and a static reduced-motion fallback. Runtime
helpers live in scripts.ts, use arrow functions and do not use beforeunload.
The status label uses common.loading from the current locale's dictionary.

## JavaScript and TypeScript style

Use arrow functions by default for all new or modified code, including callbacks
and object methods. Avoid classes and `this`. Use `function` only when a required
API depends on behavior an arrow cannot provide, such as its own `arguments`.

## Development principles

This is a new Astro 7 base. Use the old Astro 5 project only as context about
preferences; do not copy its implementation. Propose current approaches as
features are requested.

Pages use SSG (`output: 'static'`). The Vercel adapter supports Server Islands
with `server:defer`. Configure full SSR only in a future project that needs it.
Vercel installs with pnpm and builds/runs with Bun. Keep secrets in ignored
`.env*` files or Vercel, and document variables in `.env.example`.

Use `bun run verify` to check formatting, Astro/TypeScript diagnostics and the
production build after configuration changes.

When starting the dev server, use background mode:

```
bun run dev
```

Manage the background server with `bun run astro dev stop`,
`bun run astro dev status`, and `bun run astro dev logs`.

## Component API documentation

Every reusable component owns a folder under src/components with its README.md,
source and supporting scripts/styles. Single-entry components use index.astro;
related pieces such as Theme Init/Switch or GTM Head/Consent share a feature folder.
Do not leave standalone component files or docs mixed at the components root.
Only the documentation index src/components/README.md belongs at that root.
Write all developer documentation in English, including example comments.
Document actual props/slots, callable client APIs, events, configuration, examples
and relevant limits. Keep documentation in sync and ship it in generated projects.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project memory

.agents is the persistent source of project context. Read .agents/README.md and
.agents/memory/project.md at the beginning of a task. Update conventions when
the user establishes a rule, lessons when a correction matters, and todos only
for explicitly requested pending work. Keep component API documentation beside
the source, separate from operational memory. All new developer documentation
and memory must be in English. Do not treat installed skills as permission to
publish, deploy, send messages, or override the user's instructions.
