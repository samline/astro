# Link

A native anchor with locale-aware internal URLs and `noopener` for new-tab
navigation. It adds no appearance or browser JavaScript. Use it for navigation;
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

<Link href='/' class='text-accent underline underline-offset-4'>
  {buttons.backHome}
</Link>
```

Expected result: a normal homepage anchor. With the default configuration, en-us
links to `/`; an active es-mx locale links to `/es-mx/`. The current locale comes
from `Astro.currentLocale`; do not pass it as a prop.

## API

| Prop                     | Default  | Purpose                                              |
| ------------------------ | -------- | ---------------------------------------------------- |
| `href: string`           | Required | Destination URL or fragment.                         |
| `localize: boolean`      | `true`   | Localize eligible root-relative internal paths.      |
| Native anchor attributes | —        | `target`, `rel`, `download`, `class`, `aria-*`, etc. |
| Default slot             | —        | Content that names the destination.                  |

## Which URLs change?

| Input                                      | Behavior                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `/contact?from=home#form`                  | Uses Astro's locale URL helper and preserves query/hash. Create that page first. |
| `/es-mx/contact` with es-mx active         | Preserved; no second locale prefix.                                              |
| `https://…`, `//…`, `mailto:…`, `tel:…`    | Preserved.                                                                       |
| `contact`, `#details`, `?page=2`           | Preserved as a browser-relative URL.                                             |
| A link with an active `download` attribute | Preserved as a resource URL.                                                     |
| Any link with `localize={false}`           | Preserved exactly.                                                               |

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
