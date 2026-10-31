# Link

A native anchor with locale-aware internal URLs and `noopener` for new-tab
navigation. Its default plain variant adds no appearance or browser JavaScript. Use it for navigation;
use Button's native button mode for actions.

## Availability and placement

Included in every generated project at `src/components/Link/index.astro`.
Place navigation inside the owning section or its reusable child. This complete
example can live in `src/sections/HomeLink/index.astro`.

## Complete example

```astro
---
import Link from '@/components/Link/index.astro'
import { getDictionary } from '@/i18n'

const { buttons } = getDictionary(Astro.currentLocale)
---

<Link href='/' variant='text'>
  {buttons.backHome}
</Link>
```

Expected result: a normal homepage anchor. With the default configuration, en-us
links to `/`; an active es-mx locale links to `/es-mx/`. The current locale comes
from `Astro.currentLocale`; do not pass it as a prop.

## API

| Prop                                      | Default | Purpose                                                           |
| ----------------------------------------- | ------- | ----------------------------------------------------------------- |
| `variant?: 'plain' \| 'text' \| 'nav'`    | `plain` | Shared contextual or navigation states.                           |
| `href?: string`                           | —       | Destination URL or fragment; alternative to routeName.            |
| `routeName?: RouteName`                   | —       | Named destination from src/config/routes.ts; alternative to href. |
| `localize: boolean`                       | `true`  | Localize eligible root-relative internal paths.                   |
| `currentMatch?: 'exact' \| 'descendants'` | Unset   | Opt into route-based `aria-current`, independently of appearance. |
| Native anchor attributes                  | —       | `target`, `rel`, `download`, `class`, `aria-*`, etc.              |
| Default slot                              | —       | Content that names the destination.                               |

## Which URLs change?

| Input                                      | Behavior                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `/contact?from=home#form`                  | Uses Astro's locale URL helper and preserves query/hash. Create that page first. |
| `/es-mx/contact` with es-mx active         | Preserved; no second locale prefix.                                              |
| `https://…`, `//…`, `mailto:…`, `tel:…`    | Preserved.                                                                       |
| `contact`, `#details`, `?page=2`           | Preserved as a browser-relative URL.                                             |
| A link with an active `download` attribute | Preserved as a resource URL.                                                     |
| An explicit href with `localize={false}`   | Preserved exactly.                                                               |

Link formats a URL; it does not create the destination, verify it exists, or
translate a content slug. For API/CMS content with translated slugs, resolve the
real destination first and pass `localize={false}`. Follow the project's
[localized-content guide](../../i18n/localized-content.md) for that integration.

Public assets also need `localize={false}` unless `download` is active. For a
project PDF, first create `public/docs/guide.pdf`, add `downloadGuide: string` to
`src/i18n/dictionaries/<default-locale>/buttons/types.ts`, and add a translated
`downloadGuide` value to the buttons domain of every available locale. Then, with
Link and `buttons` already in scope:

```astro
<Link href='/docs/guide.pdf' download>
  {buttons.downloadGuide}
</Link>
```

This is a customization fragment: the PDF and `downloadGuide` key are deliberately
not part of the starter. Do not paste it before completing those two additions.

## Targets, styles and limits

`target='_blank'` adds `noopener` if absent and retains supplied `rel` tokens.
Add `noreferrer` yourself when you need that policy. The slot normally supplies
the accessible name; icon-only links need a translated `aria-label` on the link.
Attributes and Astro scope attributes reach the anchor.

Use [Button](../Button/README.md) with `href` for button-like navigation. If
PageLoader is selected, `data-page-loader-skip` suppresses its navigation indicator.
No prefetch policy, disabled link simulation, or click handler is added.

URL construction belongs to [Astro internationalization](https://docs.astro.build/en/guides/internationalization/)
and its [URL helpers](https://docs.astro.build/en/reference/modules/astro-i18n/).

## Shared text and navigation states

Use `variant='text'` for an underlined contextual link in the accent palette, or
`variant='nav'` for a navigation item inheriting its surrounding color. Both
include hover, focus-visible and active states. Nav styles the resulting
`aria-current` value; matching remains an independent choice. Plain
remains the default for custom designs and Button composition. Do not use
`aria-pressed` for navigation. Layout stays with the consuming section.

## Opt into current-route matching

Leave `currentMatch` unset to retain caller-owned `aria-current`. Set it to
`exact` for a page link or `descendants` for a section link that should remain
current on its detail routes. Appearance does not opt a link into matching: a
plain link with a custom design can use the same route contract as a nav link.

With Link already imported and after creating the corresponding articles routes,
this customization fragment marks the section on its own page and child pages.
The label comes from the project's existing translated content:

```astro
<Link href='/articles' currentMatch='descendants' variant='nav'>
  {label}
</Link>
```

`label` is illustrative; supply an actual dictionary value from your section.
Matching uses the final localized URL and the current page URL:

- The exact pathname receives `aria-current='page'`; a descendant receives
  `location`. Trailing slashes are normalized and query parameters are ignored.
- Descendants require a segment boundary: `/articles-new` is not inside
  `/articles`. Different origins and other locale prefixes do not match.
- The homepage stays exact-only, including its configured base and locale root.
- A destination with a fragment requires the same page and fragment, and receives
  `location`. Requests do not contain URL fragments, so static/server HTML cannot
  identify an active fragment from the request.
- An explicit `aria-current`, including `'false'`, takes precedence. Query-based
  tabs, named route groups with nonhierarchical URLs and other non-path identity rules should leave matching unset and supply
  their own value. Prefer the most specific matching entry within one navigation
  set rather than marking every ancestor current.

No browser controller, global listener or script is added. Static output records
the route at build time; on-demand output uses the render request. Read-only route
matching does not require a server adapter.

Inside a Server Island, the render URL belongs to the isolated request. For
parent-page navigation, resolve the real parent context first and supply an
explicit `aria-current`; do not infer it from the island endpoint. See
[parent query context](../../i18n/localized-content.md#parent-query-context-for-server-islands).

For existing client navigation or cloned menus, the owning controller can import
`currentDestination` from `@/components/Link/current`. Its arguments are the
resolved destination URL, current URL, optional match mode (default `exact`) and
the actual homepage pathname including base/locale (default `/`), which also
limits matching to that path's scope. It returns
`'page'`, `'location'` or `undefined` without reading or changing the DOM. Reuse
this function after the owner's navigation/clone event; preserve authored
overrides and scope updates to that owner's links. This is an integration point,
not automatic hash tracking, scrollspy or a lifecycle manager.

## Named routes

Pass `routeName={routeNames.home}` instead of `href` to select a destination from
`src/config/routes.ts` in the current locale. Import `routeNames` from
`@/config/routes`. Named links use Astro's locale/base formatting and throw if the
current translation is unavailable. They compose with `variant` and `currentMatch`;
`localize={false}` only affects explicit hrefs. Do not supply both destination props.
See [localized routes](../../i18n/localized-content.md) for translated static paths,
Main/SEO/LanguagePicker context, and actual CMS translation maps.
