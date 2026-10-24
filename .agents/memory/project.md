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

- Root and CLI version: 7.15.0.
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

## Server mail

SMTP mail lives in src/server/mail, not components. The public index imports
astro:env/server and exposes sendMail, sendFormMail, renderFormMail and their
types. mailer.ts owns lazy SMTP validation/delivery; template.ts owns escaped,
localized HTML and plain text. Nodemailer was installed with latest (10.2.1).
No network connection is opened by importing the service or during normal SSG.

MAIL_ENABLED must be exactly true. MAIL_FROM/MAIL_TO are fixed single addresses;
visitor email is replyTo only. Secrets use getSecret at each send and optional
server-secret schema fields. Authenticated SMTP requires TLS (implicit on 465,
STARTTLS otherwise), bounded connection timeouts, no pool or automatic retries,
and no filesystem/URL-backed content. Provider failures are sanitized; SMTP
acceptance does not prove delivery. Preserve commented mail settings when the
installer generates profile-specific .env files.

The form renderer uses an explicit ordered field list with translated labels,
never dumps arbitrary submitted keys. The mail dictionary is modular in both
locales. Its neutral inline email styling is independent of website Tailwind.
The base adds no contact page, form UI, or real credentials. A contact Action
now connects request validation to this mail service; see the next section. Keep
SSG; opt individual endpoints out of prerendering or use Actions with an adapter.
Pure static hosting needs an external backend; Workers needs a compatible HTTP
API/binding transport implemented in that project. SMTP in Workers is unverified.

Tests use fake settings and in-memory transports, including Nodemailer MIME
composition. No external test message has been sent and provider delivery has
not been validated.

## Contact Action

The Astro 5 contact demo is replaced by src/actions/contact (schema, index, README)
and registered as server.contact from src/actions/index.ts. Use Astro 7
astro:actions and astro/zod, accept=form, and arrow handlers. Input: locale
(default active locale), name, email, optional phone, message, website honeypot.
Trim and bound input, validate enabled locale/email/phone, strip unknown keys,
and return dictionary messages for validation/success/failure. Use an explicit
mail field allowlist; visitor email is replyTo, never sender or destination.

Require same-origin Origin, including rejecting missing headers. Filled honeypots
return success without delivery. These checks are basic, not complete abuse
protection; project-specific distributed limits/challenge belong at deployment.
No generic relay, obsolete collection demos, commented CAPTCHA, form UI, or
provider error details are migrated. Use actions.contact(FormData) in an SSG
section's browser script; no request-specific Astro.getActionResult during SSG.

Pages remain output=static and prerendered; registration requires an adapter and
adds a server function. Default Vercel plus generated Netlify/custom register it.
The installer leaves the import and server export commented out in
src/actions/index.ts.example for static and Cloudflare, while retaining the demo source/docs; a Worker-compatible transport is still
required there. The static generated-package build verifies no server dependency.
With registered actions, Vercel's final static assets are under
.vercel/output/static; SSG feature tests inspect that deployment directory.

HTTP tests run an Astro dev fixture with mocked mail, validating real action
submission, errors, origin checks and honeypot behavior. No real messages sent.
Local HTTP tests require permission to listen on loopback under restricted
sandboxes; use a strict port to avoid Vite endlessly retrying denied binds.

For inactive integrations, preserve ready-to-uncomment registration instead of
deleting it. Keep the inactive entry named index.ts.example, with both import and export
commented. Astro 7.4 checks actual exports for route registration, but its Vite
entry resolution still imports server from an existing index.ts; a commented-only
index.ts fails static bundling with MISSING_EXPORT. Activation requires removing
the .example suffix, uncommenting, and configuring adapter/transport support.

## Astro 7 collection and API examples

Version 7.15.0 adds src/content.config.ts with a local posts JSON/glob example.
Feature code is under src/content/posts, remote, and live; docs are in
src/content/README.md. Local demo entries store locale, copyKey, publishedAt and
draft; all visible demo text lives in modular content dictionaries for en-us
and en-mx. Query active locale/draft explicitly and sort deterministically. IDs
come from file paths; there is no legacy slug or entry.render() assumption. No
public demo routes or UI were installed. Future Markdown uses render(entry).

Optional remote definitions are commented in content.config.ts. apiPosts shows
a bounded normalized JSON API page; strapiStores demonstrates explicit Strapi 5
documentId/locale mapping and pagination (100 rows/page, at most 100 pages).
Build loaders read private build environment via loadEnv rooted at config.root.
They validate the entire snapshot and reject duplicate IDs before store.clear;
errors fail the build instead of silently yielding empty collections.

The pure request client is src/server/content-api/client.ts; its public server
entry reads CONTENT_API_URL/TOKEN lazily through getSecret. Use HTTPS or loopback
HTTP, keep paths below the configured base, reject redirects, bound timeouts,
check HTTP status/JSON/Zod, strip unknown response fields and filter draft/locale
data. Never accept a browser-supplied destination or token/header override.

Live Collections are optional via src/live.config.ts.example. Remove .example
and uncomment only with an adapter/on-demand consumer. defineLiveCollection
must be called directly in live.config.ts; reusable loadCollection/loadEntry
logic stays in content/live/index.ts. getLiveCollection/getLiveEntry are distinct
from build-time getCollection/getEntry. No experimental flags or global SSR.
Test fixtures use canonical real paths because Astro's live-config resolution
compares the exact importer path; /var vs /private/var aliases can break it.

Optional contentDemo.list/create Actions stay unregistered. The read Action
makes a GET upstream but Astro RPC itself remains POST. Mutation requires a
project-specific server session/role check: canCreatePost denies all by default,
and Origin must match before a write. These examples operate on a remote source,
not the immutable build-time collection store; SSG output needs a rebuild after
changes or an intentionally live consumer. No auth framework, CMS mutation,
public API relay, secret credential, or provider-specific live endpoint is imposed.

Installer optional environment examples are preserved for all profiles, with
Worker runtime API secrets documented in .dev.vars.example. Inactive Actions
retain contact/contentDemo registration recipes in index.ts.example.
Generated projects ship all collection/API/docs examples. Exclude all README.md
files from Tailwind scanning so developer examples do not generate site CSS.

Tests cover schema/HTTP errors, URL boundaries, credential redirects policy,
read filtering, Strapi pagination, snapshot replacement, live error semantics,
and real local Astro collection/Action queries using fake upstream data. No
external CMS was contacted or modified.

Validation for 7.15.0: bun run verify passed (74 tests, no Astro/TypeScript
diagnostics, i18n guard, formatting, SSG build with the existing Action backend).
bun run kit:pack produced the local 7.15.0 archive and validated its distribution.
The extracted package also built the pure-static profile. Live config activation
and API Action reads were exercised over loopback with fake upstream content;
mutation remained denied and no external service was contacted.
