# Architecture decisions

Migrated from the codebase-memory project ADR on 2026-10-23. This file preserves
the decisions accumulated while developing the base. Keep future decisions here;
the graph is a structural lookup tool, not the only copy of project memory.

## PURPOSE

Preserve the user's distinction between a semantic page section and its inner content-width container. This is a new Astro base; Astro 5 supplies the intended responsibilities, not a legacy implementation to copy blindly.

## ARCHITECTURE

Visual hierarchy: page entry -> layout -> domain section -> components. Pages contain route/data logic, metadata and composition, not loose UI markup or browser scripts. src/layouts/Main.astro owns the document, SEO and unique main landmark. Domain sections live in src/sections next to src/components and compose the reusable primitives and content components. Components must not import layouts or domain sections. Ordinary Astro components read Astro.currentLocale directly; only isolated Server Islands require an explicitly supplied parent locale.

## SECTION

Source: src/components/Section/index.astro. Section is a semantic <section>, NOT a content-width container. Its required id provides a stable, unique anchor. Associate it with a real heading using aria-labelledby when appropriate. It owns vertical rhythm: default padding-block is 2.5rem, 4rem at a 48rem viewport and 5rem at 64rem. padded=false removes the component's default padding. --section-padding-block customizes spacing; --section-scroll-offset supports anchor offsets for future fixed headers. Section does not automatically center children or insert a Box. It can contain several Boxes, backgrounds and full-width blocks.

## BOX

Box.astro: centered div width container, no semantic section, decoration or vertical spacing. Full width max90rem, gutters1.25rem; narrow48rem, wide120rem, fluid no max replaces x2/liquid. --box-max-width and --box-gutter customize. Border-box includes gutters; min-inline-size:0 supports flex/grid.

## PATTERNS

Domain sections compose Section > Box > content. Welcome and NotFound each own an index.astro and private content component; Section may hold multiple Boxes/full-width blocks.

## TRADEOFFS

Primitives use native typed HTMLAttributes, slots, class:list and logical scoped CSS. Forward rest/native/Astro scope attrs and merge classes; consume size/padded props. No any/client JS/Tailwind just for wrappers.

## DOCUMENTATION AND VALIDATION

Every reusable component owns a folder with source, README.md and supporting files. Single-entry components use index.astro; Theme/GTM share feature folders. Only the README index lives at components root. All developer docs and example comments are English; maintain real props/APIs/events/config/examples/limits and ship docs. Tailwind excludes component Markdown. verify checks format/i18n/TS/tests/SSG; kit:pack validates distribution. Use arrows, no classes/this; function only when required.

## LINK

Link.astro: href-required typed native anchor with slots, native/scope attrs, no styles/client JS/any. Uses own Astro.currentLocale and native URL helpers for root-relative routes; preserves query/hash and active locale prefixes. External, relative, hash, query and download URLs unchanged. localize=false for public assets/endpoints/resolved locale links. target=_blank adds noopener, preserves rel; noreferrer optional. Accessible name from translated slot/aria-label, no generic label. Native anchors for scroll and buttons for forms. Used in WelcomeContent, NotFoundContent, LanguagePicker; SSG tests cover both locales and URL/attribute kinds.

## COMPONENT OWNERSHIP

User rule: src/components contains ONLY components reusable across sections or layouts (Section, Box, Link, SEO, LanguagePicker). Components specific to one section live INSIDE that section's directory. Each domain section uses src/sections/<Name>/index.astro as its entry, with private components alongside it. WelcomeContent lives at src/sections/Welcome/WelcomeContent.astro; NotFoundContent lives at src/sections/NotFound/NotFoundContent.astro. Pages import @/sections/Welcome/index.astro or @/sections/NotFound/index.astro. Section entries use relative imports for their private components. Do not put section-specific content back in src/components. Preserve page -> layout -> section -> component hierarchy; shared components never import sections/layouts.

## TAILWIND

Tailwind4 @tailwindcss/vite. Main imports global.css -> tailwind.css. Config/variants/@theme tokens only in tailwind.css; base selectors global.css. source('../') scans src. Rem breakpoints xs375 sm600 md768 lg1024 xl1200 2xl1366 3xl1440. Authored rem/unitless0; intrinsic/library dimensions preserved. Palette black/white/placeholder, states, Astro-site blue accent #3245ff, purple accent-sec #bc52ee, pink accent-third #f041ff; light/dark20% white/black, literal hex in @theme. Main theme-color matches primary. Default palette disabled, no TS colors. Literal Inter Variable fonts, Fontsource local normal/italic100–900 swap. Prettier Tailwind last. Normalize extends Preflight, preserve focus/root size. Welcome uses light:/dark: utilities and logo inversion.

## THEMES

Grouped under src/components/Theme/: Init.astro in Main head initializes theme; Switch.astro is the reusable native role=switch button in Welcome. Imports alias ThemeInit/ThemeSwitch remain descriptive. Switch uses translated themes.darkMode, aria-checked, native attrs/classes/slot and is hidden without JS. Init applies data-theme before paint, delegates clicks, syncs instances/tabs, follows OS until explicit choice, tolerates blocked storage. Idempotent window.samlineAstroTheme; before-swap updates incoming page, page-load refreshes controls. config/theme.ts only defaultPreference system|light|dark and storageKey; Tailwind owns colors, global.css sets background/text/color-scheme. No-JS system fallback light. API setPreference/getPreference/getTheme/refresh and themechange event; setPreference('system') restores OS. Motion-aware switch. Tests cover persistence, keyboard, OS/storage/navigation and duplicate listeners.

## GTM

Main integrates GTM/Head and conditionally GTM/Consent; Body wrapper removed. No ID disables UI/client script. GTM_ID/GTM_ENABLED default prod nonlocal outside provider previews, independent of SEO. config/gtm.ts: basic, interaction, cookie180d, revision, optional policy. Basic queues four denied v2 signals; GTM loads on independent analytics/marketing grant; revoke updates then reloads. No noscript/manual initial page_view. Explicit advanced loads before grant; virtual astro_page_view on changed path/search after optional grant. Consent embeds locale/translations on preferences button. Lazy consent-sdk imports SDK, config builder and CSS URLs after scroll/wheel/touchmove/keyboard/preferences click; returning cookie triggers SDK validation immediately. CSS loader caches by URL and retries only failed downloads. Modular cookies dictionaries, HTML escaping, no unused service counts. No bot detection. Customize real tags/cookie patterns/policy; validate actual container with Tag Assistant.

## CONSENT PRESENTATION

Live dinkbit.com reference: bottom-center box, flipped groups (settings row, reject/accept below), neutral buttons, modal .5rem/button .4rem corners, blocking dim overlay. Adapt black/white Tailwind mixes and dark theme. Test with temporary fake ID in process env and local production preview; real tracking needs actual container.

## PAGELOADER

PageLoader/index.astro in Main body. Keep ldrs by user preference for easy animation swaps: ping import/register/l-ping together. Tailwind overlay with accent/dark and static reduced-motion fallback. common.loading label, hidden without JS. scripts.ts arrow exports showLoader/hideLoader, delay250ms and safety10s, clears timers. Native internal links/forms; ignore hashes/downloads/modifiers/new-tab/external/cancelled/opt-out. data-page-loader-skip opt-out. pageshow/pagehide clear BFCache; no beforeunload. Astro preparation wraps loader in finally; navigation token prevents old completion hiding newer state. page-load clears; no router added. Does not block controls/wait for Server Islands. Tests cover timers/filtering/forms/errors/races; remove temporary preview fixtures.

## Fields (7.16.0)

Keep related native form primitives together under components/Fields with one
English README. Preserve native behavior and attributes; separate wrapper props
from control props. Floating labels remain visible, and value-filled is not a
success state. Select consumes typed option/group data, never parses slot HTML.
All authored UI text comes from modular dictionaries; native browser control
strings follow browser localization. Fieldset supplies real legend semantics.

Optional SAM Forms ESM handles controller state; Form itself stays transport-free.
Sections connect Actions/API/external backends and render general statuses.
No Alpine or product-specific calendar/country/payment/provider dependencies.
Do not mutate error element child lists on every subscription: SAM observes the
form subtree and would recursively notify. Update persistent Text nodes instead.

## CAPTCHA (7.18.0)

Captcha is provider-neutral. CAPTCHA_PROVIDER is a build-time enum with none as
the default; Turnstile Managed and Google reCAPTCHA v2 checkbox share the
captchaToken submission contract. CAPTCHA_SITE_KEY is public; CAPTCHA_SECRET_KEY
is read server-side at runtime. CAPTCHA_HOSTNAMES defaults to SITE_URL hostname
and is an exact configured allowlist, independent of request Host. All visible
feedback lives in modular captcha dictionaries. Explicit SDK rendering is scoped
to actual widgets; no global layout load. Public mount/reset/destroy APIs handle
dynamic markup and Astro navigation. Reset after every submission attempt; no
client callback substitutes for server verification. Pure static hosting still
needs an external backend. The contact Action checks Origin, ignores honeypots,
verifies the challenge, then sends only explicitly allowed mail fields. Google
v2 exposes reset rather than remove, so remount uses a fresh owned container.

## Localized API content guidance

The user requested persistent instructions for future API integrations after
reporting a language switch reusing an untranslated slug. The guide is
src/i18n/localized-content.md, also linked from the portable agent conventions
and inherited decisions. It requires explicit translation relationships, real
published paths, one shared navigation/SEO result, build-time resolution for SSG,
request-time resolution for SSR/live consumers and explicit client update rules.
Missing translations must not create guessed URLs. Cache, publication/access,
query/hash, default-prefix and provider failure policies belong to each integration.
This request documents the future integration workflow only: LanguagePicker and
SEO still reuse a single path, and no runtime resolver or CMS adapter was added.

## Authentication integration

Auth stays optional. Common server guards separate session management and access
policy from the identity authority. REST mode uses a purpose-built Better Auth
stateless plugin and fresh upstream profile checks; database mode uses owned
users/sessions, and OAuth uses Generic OAuth with configured provider policy.
Do not imply native email/password can authenticate any external REST API.
External access/refresh credentials are private, encrypted, session-bound cookies;
never put them in user JSON/data attributes or let browser input grant roles.
Use server-only withExternalToken after an access rule for fixed-destination API
operations. Database migrations and account signup are explicit choices.

Public pages remain prerendered; private full pages opt out. Server Islands can
personalize public shells but need their own guards and private/no-store caching.
Actions require independent permission/ownership checks. Route policies are not
inferred from translation dictionaries, role order or broad path exceptions.
Stateless cookies have bounded revocation/renewal limits documented with the API.
No per-device/global revocation promise without the necessary backing authority.
