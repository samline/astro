# Architecture decisions

## Inherited base conventions

The project begins with static output and the selected deployment adapter.
Add full SSR only when a project requirement justifies it. Keep sections and
reusable components separate, with the document and metadata owned by Main.

Section provides semantics and vertical spacing; Box constrains content width.
Link uses native navigation and Astro localization helpers. Components read the
current locale themselves, except across isolated server boundaries.

Tailwind owns design tokens. Theme initialization runs before paint. GTM is
optional and starts with denied consent signals; analytics and advertising are
independent. PageLoader retains ldrs to make animation changes straightforward.

Keep the inherited component API documentation alongside the source. Read it
before altering behavior; record new project decisions below as they are made.

## Localized API integration guidance

Before adding API/CMS content or translated slugs, follow
src/i18n/localized-content.md. Astro handles URL formatting; equivalent content
must be identified through a stable translation group or explicit provider
relation. If LanguagePicker is installed, coordinate its path contract with SEO when
actual localized destinations differ. This guidance
does not mean translated-slug resolution is already implemented.

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
