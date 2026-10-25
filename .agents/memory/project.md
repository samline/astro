# Project state

Last reconciled: 2026-10-25.

## Purpose and layout

SAM Astro is a new Astro 7 base for SSG sites with Server Islands, using Vercel
by default. The old Astro 5 project is a reference for intent, not an implementation
to copy. Dinkbit is a reference for breakpoints and consent presentation.

The application lives directly at the repository root, not in a nested scaffold.
Pages compose layout -> section -> reusable component. Each reusable component
owns its source, English README, and supporting files inside src/components/<Name>.
Section-only pieces stay beside their owning section.

## Versions and distribution

- Root and CLI version: 7.19.0.
- Astro dependency: ^7.4.2; use Astro 7.4 behavior and current official docs.
- Tailwind CSS 4 via its Vite plugin; TypeScript 6 and Vite 8.
- Install with pnpm; execute project scripts with Bun.
- Repository: git@github.com:samline/astro-kit.git; current branch main.
- Previous baseline commit: 549f430 (SAM integrations and API/client translations).
- Prior feature commits: d9f3d8f (GTM/consent/themes), cb62214 (UI primitives/themes).

The public generator is @samline/astro and must run through npx with Node.
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

## Fields

Version 7.16.0 adds reusable native controls in src/components/Fields: Form,
Input, Textarea, Select, Checkbox, Radio, File and Fieldset, with internal
Field/Choice shells, types, CSS, enhancements and English README. EasyTrip is
reference intent only; Laravel/Alpine state, country/gender defaults, HERE,
Stripe, Drawer/Cally and product regex were not migrated. No demo page is added.
See memory/fields-analysis.md for the source analysis requested before migration.

Floating labels remain visible; basic/compact variants, supplied/generated IDs,
merged descriptions, escaped help/errors, optgroups/multiple/zero and native
attributes are supported. Inputs keep browser keyboard/autocomplete/date/file
behavior. Do not prefill passwords. Control class is separate from fieldClass.
Configuration stays in Tailwind; component CSS declares layer order so Preflight
cannot override its padding/borders when Astro reorders stylesheet imports.

@samline/forms 2.7.2 is an explicit dependency. Form alone neither initializes
nor bundles the optional controller. scripts.ts exports createForm/destroyForm/
destroyForms; default autoValidate=false, ESM without globals. Consumers provide
translated validators and own transport/status/repeat-submit behavior. SAM schemas
are separate from native required/type/pattern. Safe error text nodes avoid a
MutationObserver loop; errors are scoped to their form and async state sets
aria-busy. Native reset is bridged; API reset suppresses recursive scheduling.
Avoid control names/IDs shadowing native reset/submit/requestSubmit methods.

Password/file enhancements delegate once, refresh on page-load, and support an
explicit mountFields/refreshFields API for inserted markup. File clear emits
input/change; native reset restores password type. Controllers clean up on
before-swap and non-persisted pagehide, or explicit destruction before removal.

Validation: bun run verify passed 76 tests, clean Astro diagnostics, i18n,
formatting and SSG build; local installer packaging includes all Fields files
and docs. Temporary Chromium checks covered JS/no-JS, keyboard, error escaping
and form isolation, native values/FormData, password/file/reset, async pending,
repeated mounting/destruction and themes/mobile. No provider delivery, production
deployment or complete WCAG conformance is inferred from these checks.

## Cleanup before Fields commit

Reviewed source, support scripts, tests and distribution boundaries after Fields.
Removed the temporary browser-harness globals and async submit hooks from the
permanent SSG test fixture; the automated fixture now contains only what its
rendering/asset assertions exercise. The real Chromium checks above were performed
before removing those manual-only hooks. Removed obsolete ignored local archives
7.14.0/7.15.0 and a redundant intermediate array in the form adapter. Optional
Action/Content examples and documented public APIs remain intentional starter
capabilities. Prettier uses the repository exclusions to preserve upstream skills,
generated files, binary/public assets and the pnpm-managed lockfile.

## Branch integrations (7.17.0)

Helpers remain excluded: the user plans independent packages. Components remain
paused. Astro 5, including breaking-changes/new, is reference intent only.
Forms keeps SAM Forms 2.7.2 and now installs SAM Formatter 2.0.3; declarative
formats and format/formatAll own masks, raw mirrors and cursor behavior. Local
Fields code is only Astro UI/lifecycle glue. No legacy formatter files were added.

The existing requestJson API supports explicit GET/POST/PUT/PATCH/DELETE, repeated
query values, caller cancellation plus timeout, bounded 2 MiB JSON streams and
204/schema contracts. Failed HTTP status always fails; example success:false
fails validation; valid empty arrays remain successful. No dynamic relay or
public mutation endpoint was added. Authorization remains at each consumer.

content/live/api.ts exposes apiLiveLoader: separate upstream and output Zod
schemas, stable ID mapping, duplicate and requested-ID checks, unchanged Astro
contexts for both callbacks, atomic result success and safe error results.
postsLiveLoader consumes it. Empty, missing and failed are distinct. No global
user session, random IDs, silent partial records or snapshot mutation.

Main adds opt-in clientTranslations with typed domain keys. It emits selected
active-locale dictionaries in inert escaped JSON under kit-translations. Default
is no payload; section scripts reread current DOM on page-load. No Base64,
window cache, client helper or custom router was added. Docs: src/i18n/README.md.

Auth-astro/login/roles/profile/registration/password recovery/membership business
models from the experiment were intentionally excluded: a generic SSG starter
has no identity authority or provider contract for them. Keep public pages SSG
and integrate verified private authorization in a future project as needed.

Validation for 7.17.0: 80 tests passed with formatting/i18n, no Astro/TypeScript
diagnostics and successful SSG build. Local kit:pack validated the 7.17.0 archive.
Chromium exercised real SAM packages for masks, raw/display submission, errors,
reset and mirror cleanup/remount. No deployed API or real delivery was tested.

## Package rename and CAPTCHA (7.18.0)

The user renamed the generator to @samline/astro and reserved astro-kit for a
future integration. Root private manifest and CLI share the new name/version;
CLI bin is samline-astro, runtime namespaces are samlineAstroTheme/samlineAstroGTM,
metadata is samlineAstro and theme storage is samline-astro:theme. Distribution
instructions and portable seed use SAM Astro. The local folder and Git remote
retain their existing names; nothing is published to npm.

The prior cleanup was committed as 549f430, with 80 tests and SSG build passing.
The user then explicitly authorized CAPTCHA migration while general component
and helper migrations remain paused. Captcha owns its UI/docs/client lifecycle;
server/captcha owns the private verification boundary. Global build settings
choose none (default), Turnstile Managed or Google reCAPTCHA v2 checkbox, with
one public site key and a private runtime secret. The contact Action verifies
after Origin/honeypot and before sending mail. Hostnames are exact configured
values, falling back to SITE_URL. No browser-selected provider or secret exposure.
Provider availability, malformed results and mismatched hosts fail closed.
Pure static hosting still needs an external verification backend or adapter.
Client tokens use captchaToken; reset after every request; mount/reset/destroy
are public APIs. No real provider credentials or live challenge is assumed.
Validation: bun run verify passed all 84 tests, formatting/i18n, clean Astro/TS
and the SSG build. Server verifier tests use fake HTTP responses for both official
endpoints; the real Astro Action HTTP fixture proves failed tokens prevent mail
and honeypots bypass verification without delivery. Empty FormData values are
normalized because Astro returns null for empty optional inputs. Temporary
Chromium checks passed for disabled mode, both provider SDK mocks, load failure /
retry, multiple widgets with one SDK, FormData isolation, expiration, reset,
cleanup/remount, ignored late callbacks and no-JS guidance. No real provider
credentials, live challenge, external delivery or production deployment tested.
Local kit:pack succeeded and generated artifacts/samline-astro-7.18.0.tgz.
The 7.18.0 changes are included in the subsequent 7.19.0 cleanup commit.

## Localized API integration documentation

Read src/i18n/localized-content.md when adding an API/CMS with translated routes.
The guide ships under src and is required by generated .agents conventions and
inherited decisions. It covers SSG, SSR, live and browser-loaded content, stable
translation identity, publication/availability, cache policy and shared selector /
SEO destinations. Current LanguagePicker and SEO path contracts are unchanged;
translated-slug resolution is not implemented merely by documenting it.

## Authentication integration (7.19.0)

The user authorized implementation after reviewing All Influencers. Better Auth
1.7.12 and pg 8.23.1 are installed with pnpm (@types/pg 8.23.1 development-only).
The integration is under src/server/auth, with browser-safe src/auth/client.ts,
explicit src/config/auth.ts route rules and an inactive auth API route example.
AUTH_MODE defaults to disabled. No login page, business role, subscription model
or legacy helper was copied. Public output stays SSG with optional Server Islands.

Modes: external REST (no local user DB), project-owned database (PostgreSQL),
and stateless OAuth/OIDC. External REST is a custom Better Auth plugin using its
exported cookie APIs: a Better Auth JWE session plus a separately encrypted,
HttpOnly credential cookie bound to session/user IDs. No upstream token in public
session JSON, browser storage or HTML. API base/paths are server-configured;
requests forbid redirects, bound timeout/JSON and validate mapped identities.
Same-origin Origin is required on mutations. The route replaces the browser IP
header with the adapter-resolved address for rate limiting.

requestAuth and locals.auth offer getSession, requireSession, requireAccess and
withExternalToken. Roles are any-of, permissions all-of, verification explicit;
constraints combine with AND. Parent/child route rules combine; dotted paths
are not bypasses. Private prerendered pages fail build. Actions/endpoints/islands
must guard their own work and ownership; public shell HTML cannot be private.
Set private/no-store on personalized island responses. The user specifically
confirmed SSG pages with authenticated Server Islands must work.

REST reads revalidate the upstream profile on each new request, with request-only
memoization. Token revocation/permission changes deny the next protected read.
Refresh is explicit before expiry: optional API renewal, otherwise profile-only.
Logout always clears local cookies and reports actual upstream revocation status.
Copied stateless cookies cannot be individually invalidated locally without a
server store; configure upstream revocation or accept bounded expiry. Token
sizes and credential-cookie payloads are bounded; larger providers need storage.
OAuth follows its own provider/session TTL and needs project revalidation policy
for immediate access changes. Public OAuth token-export endpoints are blocked.

Owned-user mode uses Better Auth schema/session storage; client role/permission
fields are input:false, cookie cache is disabled and current DB records authorize.
Native signup stays disabled until the project chooses provisioning/account policy.
The explicit auth:migrate command prepares PostgreSQL core/shared fields; no
migration runs on install/build. The standalone script works with Bun or Node
and ships with generated projects. Alternative adapters/plugins need matching
project migrations. No real PostgreSQL service or identity provider was connected.

Validation: actual handler tests cover REST across instances,
credential binding, permission freshness, revocation, renewal/logout, Origin,
endpoint restrictions and rate limiting. Native flow uses disposable SQLite;
OAuth code exchange uses a fake provider. Astro HTTP tests cover routes/Actions;
Chromium passed public SSG shell + private Server Island, permission removal and
upstream revocation. All real account/database/provider setup remains project-specific.
See src/server/auth/README.md for the complete activation and operational contract.

Final 7.19.0 verification passed 95 tests, formatting/i18n, clean Astro/TypeScript
(no errors, warnings or hints), and the SSG/Vercel build. Distribution tests
validated inactive auth route, server/browser APIs, explicit migration script
and tool fallback commands. A protected prerendered fixture fails the build as
required. Public shell + private island checks used a real Chromium browser and
local Astro server with fake upstream identity. No real provider/PostgreSQL
connection, account email or deployment was performed. The package remains unpublished.

## Cleanup and session lifecycle documentation

Reviewed the pending package rename, CAPTCHA and authentication integration for
leftover temporary files, empty source folders, debug code and obsolete names.
Kept optional examples, public APIs and their tests; they are intentional starter
features. Removed reference-project history from shipped feature documentation
and corrected the runtime settings comment: migration shares the schema, not
the runtime provider factory. Added profile-update documentation for external
REST and owned users, including request memoization, cookie/UI boundaries and
OAuth limitations. User requested cleanup and a local commit; no push or npm
publication is part of this request.

Cleanup validation: bun run format completed; bun run verify passed all 95 tests,
i18n and formatting checks, zero Astro/TypeScript errors/warnings/hints and the
SSG/Vercel build. The restricted test run timed out on local HTTP fixtures; the
complete run passed with loopback permissions. bun run kit:pack also succeeded
for artifacts/samline-astro-7.19.0.tgz. No real provider/database connection, push,
deployment or npm publication was performed.
