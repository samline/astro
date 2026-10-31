# Architecture decisions

## Inherited base conventions

The project begins with static output and the selected deployment adapter.
Add full SSR only when a project requirement justifies it. Keep sections and
reusable components separate. Main owns the document, metadata and shared
header/navigation/footer defaults. Ordinary routes provide metadata and sections,
not repeated chrome composition. Named slots allow exceptional overrides only.

Section provides semantics and vertical spacing; Box constrains content width.
Link uses native navigation and Astro localization helpers. Components read the
current locale themselves, except across isolated server boundaries.

Link's optional currentMatch can mark exact pages or descendant locations,
independently of appearance. Its pure resolver adds no browser controller;
explicit aria-current values stay caller-owned. See its README before adapting
navigation or cloned menus.

Tailwind owns design tokens. Theme initialization runs before paint. GTM is
optional and starts with denied consent signals; analytics and advertising are
independent. PageLoader retains ldrs to make animation changes straightforward.

Keep the inherited component API documentation alongside the source. Read it
before altering behavior; record new project decisions below as they are made.

Site chrome has explicit Main, Head, Header, Navigation, NavItems and Footer
owners, with private mobile navigation and announcement parts when present.
See frontend-conventions.md for composition and verification; the compact demo
is a starting point rather than the final architecture for a customized site.

## Localized API integration guidance

Before adding API/CMS content or translated slugs, follow
src/i18n/localized-content.md. Astro handles URL formatting; equivalent content
must be identified through a stable translation group or explicit provider
relation. src/config/routes.ts owns shared names/types; editable paths belong in
each src/i18n/dictionaries/<locale>/routes.ts with null for unavailable pages.
route-tables.ts registers tables without duplicate URLs; routeEntries exposes the
active public-page inventory for navigation/site maps. Route data is separate from
UI copy domains and client payloads;
src/i18n/routes.ts resolves active destinations for Main, SEO and LanguagePicker.
Use localizedPaths for actual dynamic translations. Custom headers forward page
identity explicitly; missing destinations are omitted, never guessed. Native
Astro routing still generates pages; the catalog performs no provider lookup.

## Authentication boundary

Authentication is optional and disabled initially. An external identity authority
can own users while Better Auth maintains the site's session. The REST bridge
requires fresh upstream profile verification per request; database mode reads
current stored sessions/users; OAuth follows its configured provider lifecycle.
Never copy tokens to public session JSON or HTML. Use the common guards inside
Actions/endpoints/islands, and keep private content out of prerendered shells.
Configure real provider mappings, permissions and lifecycle policy per project;
read src/server/auth/README.md. No role or authentication provider is universal.

## Project decisions

None recorded yet.
