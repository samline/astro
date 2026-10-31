# Architecture decisions

## Composition and APIs

Pages own routing/data, metadata and section order. Main owns the document and
single main landmark, and renders the shared header/navigation/footer by default.
Pages do not repeat these imports or mounts; header/footer slots are exceptional
overrides with layout-owned fallbacks. Domain sections compose reusable
components and keep private children inside their directory. Shared components
do not import sections or layouts. This keeps page composition independent of
reusable UI. On creation, optional demo chrome becomes Main's default; minimal
output omits it. A later demo addition uses its own Demo layout to preserve the
existing site's Main and homepage.

Section supplies semantic grouping and vertical rhythm; Box supplies width and
gutters. Keep native typed attributes, slots, Astro scope attributes and logical
CSS. Component READMEs are authoritative for props, dimensions and client APIs.

The optional welcome feature owns Home/demo sections and private navigation.
Only exact normalized localized paths receive aria-current. Adding the feature
preserves an existing homepage and requires compatible layout slots.

Link's currentMatch is an optional route-matching API independent of its visual
variant. Its pure resolver can be shared with an existing browser owner, while
the default keeps aria-current caller-owned and installs no client controller.
The demo retains exact page matching. See the component README for descendant,
localized-root, fragment and explicit-override behavior.

Site chrome has explicit Main, Head, Header, Navigation, NavItems and Footer
owners, with private mobile navigation and announcement parts when present.
See frontend-conventions.md for composition and verification; the compact demo
is a starting point rather than the final architecture for a customized site.

## Localization

UI copy belongs to typed locale/domain dictionaries. Each domain has index.ts
and types.ts; locale indexes compose modules. Domain contracts live under the
selected default locale, so Spanish-only output needs no hidden English files.
Ordinary Astro components read Astro.currentLocale; isolated Server Islands
receive the parent locale explicitly.

Native Astro helpers format URLs. API/CMS equivalence requires explicit
translation relationships and one result shared by navigation and SEO. Do not
infer translated slugs or publication availability from locale prefixes. See
src/i18n/localized-content.md.

src/config/routes.ts owns stable typed names. Each locale owns actual paths in
src/i18n/dictionaries/<locale>/routes.ts beside its dictionary index. Tables require
every name and use null for unavailable translations. They are structural data,
separate from UI domains and browser payloads; route-tables.ts only registers them.
routeEntries exposes active public-page destinations for navigation/site maps.
Main/SEO/LanguagePicker share path, routeName or actual localizedPaths through
src/i18n/routes.ts. Main passes page context to its default header; custom headers
must forward it explicitly. Missing destinations are omitted, and missing current
page/link translations fail clearly. Link/Button accept named destinations.
The catalog does not create Astro routes, discover records or rewrite sitemaps.

## Styling and browser behavior

CSS-first Tailwind owns design tokens; global.css owns base rules. Theme Init
runs before paint and Switch exposes the feature's public control API. GTM is
optional, begins with denied signals and keeps analytics/advertising independent.
PageLoader uses ldrs for replaceable animation and preserves reduced-motion,
navigation-race and back/forward cleanup behavior.

Use the existing feature lifecycle. Scope state to instances, mount idempotently
and release owned listeners, observers, timers and controllers. Dependencies own
their engines: Forms handles state/validation, Formatter handles formatting and
Better Auth handles its native session lifecycle. Local adapters connect those
APIs to Astro instead of duplicating them.

## Server boundaries

Public pages remain SSG. Private full pages opt out of prerendering; Server
Islands, Actions and endpoints check their own operation/resource permissions.
Route middleware alone does not authorize downstream work. Keep private island
responses no-store and external credentials out of HTML and public session JSON.

Authentication is optional. REST mode verifies upstream identity; database mode
owns users/sessions; OAuth follows configured provider policy. Migrations and
signup require explicit project setup. Read src/server/auth/README.md for
revocation, renewal and token limits.

CAPTCHA is provider-neutral: none, Turnstile or reCAPTCHA v2. Widgets share the
captchaToken contract; only server verification authorizes submission. The
contact Action validates Origin, honeypot and allowed fields before delivery.
SMTP uses private settings, fixed sender/recipient and validated replyTo.
Read the owning server/Action READMEs before changing security boundaries.

## Installer and ownership

The root is the source catalog. One feature registry and recipe application
serve create/add, with syntax-aware edits and static dictionary analysis.
Unsupported structures and conflicts stop before writes. Installer metadata
records choices; it never authorizes overwriting customized source.
See modular-installer-plan.md and engineering-contract.md.

Generated projects choose their tools independently of repository pnpm/Bun.
Add operations inspect current scripts instead of restoring creation-time tools.
Copied source belongs to the project; no automatic update or merge is provided.
See update-plan.md.

## Documentation and distribution

The private website workspace documents installer selections, recipes and local
APIs; official Astro documentation owns framework behavior. Source-backed
references render canonical READMEs. Website tools and dependencies stay outside
CLI and generated projects. Drawer/Ticker/Forms comprise the curated package
section; template and dependency licenses retain required notices.

Portable guidance comes from scripts/agent-context plus selected skills.
samline-astro and samline-project-kickoff are portable;
samline-astro-maintainer stays repository-only. The optional kickoff workflow
owns its English prompt and design inventory reference. Website downloads and
the copyable prompt are derived from that same skill source.
Context contains applicable project contracts rather than development history.
