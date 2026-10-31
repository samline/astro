# Project conventions

## Tools and deployment

Install dependencies with {{INSTALL}} install. Run scripts with {{RUN}} run;
use package.json as the source of truth for the actual runtime commands.
The selected runtime is {{RUNTIME}} and the deployment target is {{DEPLOYMENT}}.
Never silently install global tools or assume a different package manager.

Use {{RUN}} run verify before delivering source changes. Start development with
{{RUN}} run dev; manage the background server with {{RUN}} run astro dev status,
logs, or stop. The configured Cloudflare profile runs Astro through Node even
when Bun launches the scripts; preserve that compatibility setting.

Keep output static unless the project explicitly needs SSR. {{ISLANDS}}
Use the selected adapter and deployment files. Environment secrets belong in
ignored .env files or provider settings; document variable names in .env.example.

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

## UI ownership

Pages compose layout -> section -> reusable component. Main owns the document,
SEO, and unique main landmark. Pages contain routing/data logic, metadata, and
section composition rather than loose UI, styles, or browser scripts.

Section-specific pieces live inside src/sections/<Name>. Each reusable component
owns src/components/<Name> with its README and supporting files. Single-entry
components use index.astro; related Theme or GTM pieces share a feature folder.
Shared components do not import sections or layouts.

Section owns semantic sections, unique anchors, and vertical rhythm. Box owns
centered content width and gutters. Preserve their separate responsibilities.
Read each component's README before changing its public contract.

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

## JavaScript and TypeScript

Use arrow functions by default. Avoid classes and this in authored code; use
function only when an API requires its own arguments or another non-arrow behavior.
Prefer native HTML attributes, typed props, slots, and Astro APIs. Forward native
and Astro scope attributes, consume custom props, and avoid unrestricted any.

## Internationalization

All visitor-facing copy belongs in src/i18n/dictionaries, including metadata,
accessible labels, alt text, and client messages. Each locale has domain folders
with index.ts and types.ts. Locale indexes compose those domains. Reuse the
existing domain type contracts rather than duplicating interfaces. Read
src/i18n/config.ts for the actual default and active locales; never infer them
from a preset or add an English dictionary only to satisfy a hardcoded import.

When adding a language, inspect the current dictionaries and domain contracts,
including custom keys. Create matching structural keys with empty translation
strings for the user to fill; do not translate, copy preset text, generate
content entries or overwrite existing translations. Keep an unfinished locale
out of active routes, sitemap, alternate links and the selector until explicitly
completed and enabled. Report mismatched/dynamic shapes instead of guessing.
Components read Astro.currentLocale directly; pass locale only across
isolated boundaries such as Server Islands that cannot infer the parent locale.
Use native astro:i18n URL helpers instead of a custom routing layer.

## Styling and components

Tailwind configuration and tokens live in src/styles/tailwind.css; global base
rules live in global.css. Use complete utility names and light:/dark: variants.
Keep theme-color aligned with the primary accent. Use rem for authored CSS lengths
and unitless zero, preserving intrinsic and library-required numeric dimensions.
Fonts are local Fontsource imports. Preserve focus indicators and reduced motion.

Keep ldrs in PageLoader so animations can be swapped easily. Keep its animation
import, registration, and tag together. Consent defers SDK and CSS by interaction;
analytics and advertising permissions remain independent. Theme Init belongs in
the head, with reusable Switch controls wherever needed.

## Documentation and memory

Write developer docs and example comments in English. Keep component API docs next
to their implementation and update props, methods, events, and examples together.
Keep memory limited to current project contracts and applicable technical
constraints. Remove completed tasks and superseded rules. Do not store personal
attribution, conversations, session summaries or test-run ledgers. Report checks
in change descriptions; retain required legal attribution and license notices.

Reference documentation: https://docs.astro.build

## Server mail

Keep mail under src/server/mail and import its public entry only from server code.
Read src/server/mail/README.md and src/actions/contact/README.md before
connecting forms. The contact Action demo is registered only where the selected
profile supports the bundled SMTP service; static and Workers keep its source
with the registration commented out in src/actions/index.ts.example. Preserve
that suffix for inactive Actions so static builds work. Remove .example and
uncomment only after configuring an adapter and compatible transport. Sending is disabled by
default. Use private runtime settings, fixed sender/recipient addresses, and
validated replyTo. Keep email copy and field labels in dictionaries. Add input
validation and abuse controls at the form boundary; do not expose a generic
mail relay or send during prerendering. Static hosting needs an external backend;
Workers needs a compatible transport. Never claim mocked tests prove delivery.

## Content and API examples

Read src/content/README.md before changing collection behavior. Build collections
use src/content.config.ts, astro/loaders and astro/zod; local demo copy belongs in
dictionaries. Filter enabled locale and drafts at the consumer. Remote loaders
are opt-in and must fail visibly on invalid data rather than erase the snapshot.
Live collection definitions belong directly in src/live.config.ts, with reusable
loader logic in src/content/live. Live reads need an on-demand consumer and an
adapter, not global SSR. Optional content Actions operate on an upstream API,
not Astro's build store. Keep mutation authorization denied until real session
checks exist. Changes to a CMS do not refresh previously generated SSG pages.
Keep API credentials private at the correct build/runtime boundary.

Before consuming an API/CMS with localized pages, read
src/i18n/localized-content.md. Resolve equivalent destinations through explicit
translation relationships, never by reusing a slug with another locale prefix.
Use src/config/routes.ts for stable named pages. Main, SEO and LanguagePicker
share exactly one of path, routeName or localizedPaths; Link/Button accept
routeName instead of href. Pass actual translation maps for dynamic records and
forward page context into custom headers. Missing translations are omitted;
resolve at build time for SSG and request time for on-demand content. Record the
provider mapping and missing-translation/cache policy in project memory.

## Optional authentication

Read src/server/auth/README.md before connecting accounts or protecting content.
Authentication starts disabled with an inactive API route. Choose REST external
identity, OAuth/OIDC or project-owned users deliberately. Use the common request
context to require sessions/permissions inside every protected Action, endpoint
or Server Island; page middleware does not authorize their operations. Keep
external credentials server-side, revalidate external access, and do not accept
client-supplied roles. Private pages must opt out of prerendering; public SSG
shells can contain guarded Server Islands with private, no-store responses.
Database migrations are an explicit command, never an install/build side effect.
Read the documented stateless revocation, token size and renewal limitations.

## Engineering and example discipline

Inventory current owners before creating new markup, controllers or helpers.
Use public installed package APIs: dependencies own runtime behavior, while the
project supplies thin integration and composition. Keep state instance-scoped,
setup idempotent and cleanup explicit; preserve persisted pagehide behavior.
Do not build class hierarchies, parallel lifecycle engines or generic command
event layers where direct arrow-function calls suffice.

Preserve existing layout widths, tokens, semantics, focus and reduced motion.
Cleanup must inspect dynamic imports, generated entrypoints, exports and assets
before deleting files. A low import count alone does not establish dead code.
Run copied examples through their real entrypoints and selected runtime. Update
source, types, translations, examples and docs together when contracts change.

When adding Content Collections, select local files, API or the actual service
provider and build-time/live loading separately. Include a useful example for
that source only; do not install unrelated SDKs or invent endpoints. Keep
credentials private, pagination bounded, stable IDs and publication/locale
mapping explicit. Missing configuration and fetch/schema errors must not become
fake successful empty collections.

Use checks appropriate to the change and record actual results and limitations.
Browser evidence is needed for relevant UI/lifecycle behavior; documentation-only
edits need formatting/link review. Mock providers and local builds do not prove
remote delivery or deployment. A package version is not publication evidence.
