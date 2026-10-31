## Package manager and runtime

Install and manage dependencies exclusively with pnpm. Use `pnpm install`
(or `pnpm install --frozen-lockfile` in CI) and keep `pnpm-lock.yaml` updated.
Run project scripts with Bun: `bun run dev`, `bun run build`, and
`bun run preview`. The scripts explicitly use the Bun runtime.

The published CLI runs through npx with Node, without requiring Bun or pnpm.
Consumers choose npm, pnpm or Bun for dependencies and Node.js or Bun for scripts.
The wizard lists installed tools; --package-manager and --runtime make explicit
choices. Unattended creation follows a recognized launcher, otherwise npm when
available. An explicit missing tool fails; never silently change that choice or
install globals. Later additions preserve the existing project's current tools.
Adapt scripts, packageManager, install hooks, README and provider configuration
together. Test three managers across both runtimes. Bun dependency management
with Vercel requires Bun >=1.4 for scoped overrides; Cloudflare tooling retains
Node execution.

Keep the working Astro base at the repository root. `packages/cli/template`
is generated from an explicit allowlist by `bun run kit:prepare`, never edited
manually. Root and CLI versions match Astro's major (currently 7). Run
`bun run kit:version 7.x.y` for a release and test `bun run kit:pack` locally.

Before changing installed dependencies, identify the server owner and preserve its
foreground/background mode and flags. Stop only the authorized owned instance via
its manager, install/update with the project's package manager, restart through
the same owner and request the printed URL to verify HTTP readiness. Ordinary
source edits use HMR. PID liveness, manager registration, a TCP listener and HTTP
readiness are separate signals; a busy port does not identify this project.
In restricted environments, process inspection may fail with EPERM and Astro
status may treat the record as stale and remove it: status is not guaranteed
read-only. Diagnose with sufficient process visibility; never delete lock metadata,
use --force or terminate a PID before confirming its command/project identity.
Do not restart a user-owned session without authorization. See README.md for the
update and recovery workflow.

## Internationalization

Every visitor-facing string belongs in `src/i18n/dictionaries`: page copy,
metadata, accessible labels, alt text, validation messages and loading/error
states. Do not hardcode UI text or put translated copy in environment variables.
Split every locale into domain directories (common, forms, buttons, site, etc.).
Every domain has index.ts for translations and types.ts for its contract. Locale
indexes only compose modules; never put all strings or field types in one file.
The maintained catalog defines domain contracts in en-us and reexports them in
es-mx/es-es. Generated projects place those contracts in their selected default
locale, so Spanish-only output does not require hidden English dictionaries. Preserve one contract per domain and each locale types.ts entry.
Use the typed dictionary in Astro, and pass the current locale explicitly to
Server Islands because their request URL is not the parent page URL.

Prefer native `astro:i18n` URL helpers and `Astro.currentLocale`; do not add a
custom routing layer for behavior Astro already provides. Keep `getStaticPaths`
with the dynamic page that requires it. Pass locale-free paths to URL helpers.

Before consuming an API/CMS with localized content or translated slugs, read
src/i18n/localized-content.md. Resolve equivalent destinations from an explicit
translation relationship; never substitute the locale prefix on the current slug.
Declare stable names/types in src/config/routes.ts. Each locale owns its real
locale-free URLs in src/i18n/dictionaries/<locale>/routes.ts beside its index;
null records unavailable translations. Keep these structural tables outside UI
copy domains and client payloads. route-tables.ts registers them without duplicate
URLs; routeEntries exposes the active public-page inventory for navigation/site
maps, without creating pages or authorizing/indexing every destination.
Main, SEO and LanguagePicker
share exactly one of path, routeName or localizedPaths; Link/Button accept
routeName instead of href. Resolve actual dynamic translation maps at the
build/request boundary, forward page identity into custom headers and document
the provider mapping. Missing translations are omitted, never guessed.

`src/i18n/config.ts` is the source of truth for active locales. Default: en-us;
es-mx/es-es are prepared; additional routes are activated explicitly. The
installer emits only selected languages. en-mx is not a Spanish preset.
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
Use the size prop for width variants. Override dimensions
with --box-max-width and --box-gutter. Do not add vertical spacing or decoration.

The usual domain-section composition is Section > Box > content components.
Both primitives use native Astro HTMLAttributes, slots, logical CSS properties
and class:list, forward rest attributes (including Astro scope attributes), and
consume custom props instead of leaking them to the DOM. Do not add children:any,
loose any prop signatures, client JavaScript or Tailwind just for these wrappers.
All visible copy stays in the dictionaries.

Main imports and renders the site's shared head, header/navigation and footer
by default, outside its unique main landmark. Ordinary pages supply metadata and
content sections only. Named header/footer slots are exceptional overrides with
layout-owned defaults, not required page boilerplate. Mount shared widgets once
in the layout; reserve body-end for exceptional trailing content.

For site chrome work, follow memory/frontend-conventions.md: keep Main, Head,
Header, Navigation, NavItems and Footer responsibilities separate, with private
mobile navigation and announcement bars when present. A header file containing
all navigation modes/controllers is not sufficient decomposition. Preserve the
layout slots, SEO contract and component-owned styles/lifecycle when extracting.

## PageLoader

When PageLoader is selected, keep it in `src/components/PageLoader` and mount it
inside Main's body.
Retain ldrs for replaceable loading animations. Keep the selected
animation import, registration and custom element together in index.astro;
use Tailwind for the overlay and a static reduced-motion fallback. Runtime
helpers live in scripts.ts, use arrow functions and do not use beforeunload.
The status label uses common.loading from the current locale's dictionary.

## JavaScript and TypeScript style

Use arrow functions by default for all new or modified code, including callbacks
and object methods. Avoid classes and `this`. Use `function` only when a required
API depends on behavior an arrow cannot provide, such as its own `arguments`.

## Development principles

Use the installed Astro version and current feature contracts. Do not import
legacy implementations or dependencies into the starter.

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

Keep .agents focused on current project facts, architecture, development rules
and actionable work. Update contracts in place; remove superseded rules and
completed or abandoned todos. Keep technical pitfalls concise in lessons.md.
Do not record conversations, personal attribution, session summaries, test-run
ledgers, commit histories, release-operation logs or temporary evidence paths.
Report validation in change descriptions. Preserve required legal attribution.
Developer documentation and memory are English; API docs stay beside the source.

## Utility boundary

Form state, validation and formatting belong to @samline/forms and
@samline/formatter. Fields connects those packages to Astro markup, accessible
errors and lifecycle. Do not recreate their engines or copy legacy helpers.

## Optional authentication

Read src/server/auth/README.md before changing auth or connecting identities.
Keep auth disabled until explicitly activated. Use requestAuth/locals.auth guards
inside every protected Action, endpoint and Server Island. Never expose upstream
tokens to browser JSON or HTML. Keep public pages SSG; private full pages must
opt out of prerendering. Route rules never replace operation/resource checks.
Do not run auth migrations during install/build or against an unspecified database.

## Modular installer contract

Read memory/engineering-contract.md and memory/modular-installer-plan.md before
changing the CLI, distribution, feature selection or locale scaffolding. They
record current composition rules, ownership and supported limits.
Do not substitute another architecture or invent additional commands/providers.

Content selection must ask local/API/Strapi/Shopify/other and loading time, then
include only the selected source with its basic example. Adding a locale later
uses current project dictionary keys and empty translations, never release
preset text, translated content or fabricated CMS entries. Preserve existing
translations and keep unfinished locales inactive. check:i18n validates
active dictionaries; pending languages stay inactive until completed. Preserve the local composition checks and never execute
dictionaries to infer their keys.

## Package website

The private website/ workspace owns the package landing and distribution docs.
Read website/AGENTS.md and README.md before editing it. The root remains the
working starter; never include website source/tools/dependencies in generated
projects or the CLI archive. Preserve portable .agents. Document our installer,
recipes, defaults and APIs; refer to official Astro docs for framework behavior.
Keep the independent installer identity clear. The curated package section
contains Drawer/Ticker/Forms.

## Frontend and updates

Read memory/frontend-conventions.md before adding UI, changing component
responsibilities or writing consumer examples. It records UI ownership, styling
and lifecycle contracts.
Read memory/update-plan.md before discussing updates: there is no source-update
command today. Do not pretend add, latest generator execution or kit:version
updates already copied files.

## Original project skills

Use skills/samline-astro for generated-site conventions and
skills/samline-astro-maintainer for this repository's installer/distribution work.
The portable skill ships with generated projects; the maintainer skill stays repository-only. Keep original skill metadata separate from upstream
registry records and retain third-party notices when changing the skill catalog.
