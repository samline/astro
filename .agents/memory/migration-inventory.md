# Astro 5 migration inventory

Reviewed 2026-10-24 against Astro Kit 7.16.0, committed source 5f786e5.
Subsequent user steering paused component migrations and focused review on helpers
and branches; see helpers-branches-review.md. Do not resume components from this list.
This is a comparison and candidate inventory, not authorization to implement
all remaining features or an automatic feature backlog. No application source
was modified. Astro 5 was inspected read-only on main with a clean working tree.

## Evidence

Enumerated current source files and read the remaining Astro 5 components,
helpers, layouts, package/configuration and manifest. Graph discovery was used
for both projects and all Module result pages consumed. Astro 5 graph coverage
is unavailable and its old index includes paths no longer on disk (such as
larevel-components and extra collection files); current filesystem/source reads
are authoritative. Kit coverage reports CSS parse gaps; relevant CSS was read.
Current kit filesystem was checked for equivalent implementations and public APIs.
Official Astro pagination and MDN details/iframe/Intl docs informed modernization
suggestions. No feature was installed, tested at runtime, or migrated in this review.

## Functionality already covered

- Section, Box, Button, H and FaIcon.
- Anchor -> Link; Locale -> LanguagePicker.
- Theme initialization and switch; GTM/CookieConsent; PageLoader retaining ldrs.
- Fields, most recently rebuilt from EasyTrip with optional SAM Forms controller.
- Mail moved to server/mail and connected through the optional-profile contact Action.
- Local/API/Strapi Content Collections, optional Live Collections and API Action demos.
- Modular dictionaries/native locale routing, fonts, Tailwind/normalize, SEO,
  robots/sitemap, public directories and provider-specific deployment configuration.

## Remaining reusable UI candidates

| Astro 5 source    | Purpose                                                 | Migration direction                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Faqs              | Single/multiple accordion, initial active items         | Accessible generic disclosure/accordion; assess native details/summary before Alpine.                                                                                                                       |
| Splide            | Carousel container, track/items/arrows and initializer  | Keep a configurable carousel contract, translated controls and library accessibility; do not remove slide roles or hide its screen-reader output as old code does.                                          |
| Paginator         | Numbered pages and first/last/previous/next             | Rewrite with native links/FaIcon, real SSG page URLs and locale handling; preserve unrelated queries only where appropriate. Old previous points to current page and imports React-only react-bee.          |
| WysiwygBody       | Styling for externally rendered HTML                    | Generic rich-text typography, including content rendered from Markdown; trusted/sanitized content boundary and no arbitrary untrusted HTML API.                                                             |
| FullIframe        | Aspect-ratio embed inserted when visible                | Native iframe/lazy loading when enough, translated title and explicit provider/permission policy; avoid HTML string insertion.                                                                              |
| Fade              | Reveal animations on viewport entry                     | Visible SSR/no-JS fallback, reduced motion, observer lifecycle and typed options.                                                                                                                           |
| Counter           | Animate a number when visible                           | Render final value in HTML; optional animation, locale-aware formatting and reduced motion.                                                                                                                 |
| Ticker            | Repeating horizontal content strip                      | Generic controlled motion with pause, reduced motion, resize cleanup and safe noninteractive/hidden duplicate content. Evaluate SAM package separately if requested.                                        |
| SectionHorizontal | Translate vertical scrolling into horizontal panels     | Optional specialized effect, robust sizing/lifecycle and normal-flow fallback; lower priority than general primitives.                                                                                      |
| Recaptcha         | Client widget plus commented server verification recipe | Anti-abuse provider integration remains unimplemented; current honeypot/origin checks are not equivalent to a challenge. Evaluate widget and server validation together rather than copying commented code. |

## Helpers not ported wholesale

- debounce: typed scheduling/cancellation only when a consumer needs it.
- formatNumber/getDate: localized numbers, currencies and dates; prefer native Intl
  for presentation where sufficient and explicit currency/timezone contracts.
  Do not infer business currency from locale or install Day.js merely for a year.
- stringCase: slugify/toPascalCase, if a real consumer needs them.
- urlQuery: multivalue URL query conversion; URL/URLSearchParams already cover basics.
- form: objectToFormData/removeEmptyFields are separate from native form reading;
  arrays, booleans, files and empty values need explicit backend contracts.
- setOptionsOnSelect: dynamic browser options are not the same as current typed
  build-time Select options; add only for a dependent/dynamic select requirement.
- centerItemsBy: centering a chosen item in an overflow container; no eval/stringified functions.
- shuffleElements: DOM/array shuffling and Splide-specific helper; keep independent
  typed data utilities and avoid mutating rendered order unexpectedly.
- currentRoute: active-route matching helper is not installed as a generic menu API.
  Current Link/localization exists; recreate only if needed without a second router.
- getI18n: replaced by getDictionary/resolveLocale; browser consumers can read html.lang.

## Not missing generic base features

- ScrollTo uses a clickable span in the old base. Native fragment links are already
  available through Link; smooth scrolling does not justify copying its semantics.
- Dinkbit is a brand signature with remote image URLs, not a generic starter primitive.
- Old Header is empty; Footer is simple copyright. No substantial navigation
  implementation is waiting to migrate. Future site chrome belongs to its sections.
- lib/images/example.ts and sections/Example are placeholders, not capabilities.
- SEO already supports manifest/appleTouchIcon configuration; actual manifest and
  project-specific icon assets are not supplied. Old manifest refers to missing
  PNGs in the inspected checkout and does not constitute a complete PWA setup.
- Do not copy backups, old routing duplicates, broad any types, React/Alpine,
  parse5, compression/dev dependencies or a browser observer merely because the
  old project installed them. Assess actual feature requirements first.

Suggested order if requested: FAQ/Accordion, rich text, pagination, iframe,
carousel; then reveal/counter/ticker effects. Horizontal scroll and challenge
providers are optional project needs. Helpers follow consumers, not bulk migration.
