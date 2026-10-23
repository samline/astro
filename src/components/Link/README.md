# Link

Native link with automatic route localization and protection for new-tab targets.
Adds no styles or client JavaScript. Use native buttons for actions instead.

## Usage

```astro
---
import Link from '@/components/Link/index.astro'
import { getDictionary } from '@/i18n'
const dictionary = getDictionary(Astro.currentLocale)
---

<Link href='/' class='text-accent hover:underline'>
  {dictionary.buttons.backHome}
</Link>
```

## Props and slot

| Prop                     | Default  | Purpose                                                                    |
| ------------------------ | -------- | -------------------------------------------------------------------------- |
| `href`                   | Required | Destination URL.                                                           |
| `localize`               | `true`   | Adds the current locale to root-relative internal routes when appropriate. |
| Native anchor attributes | —        | target, rel, download, class, aria-_, data-_, and other attributes.        |
| Default slot             | —        | Link content providing its accessible name.                                |

The locale comes from Astro.currentLocale; do not pass a locale prop.

## Localization rules

| Destination                                   | Result                                                             |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `/contact?from=home#form`                     | Adapts the route to the current locale, preserving query and hash. |
| Route already beginning with an active locale | Preserved without another prefix.                                  |
| External URL, //, mailto:, tel:               | Preserved.                                                         |
| Relative path, #anchor, or ?page=2            | Preserved.                                                         |
| Link with an active download attribute        | Preserved to avoid localizing the resource.                        |

Uses Astro's helpers. The current routing configuration omits the default locale
prefix. Target does not affect localization.

For public resources or already localized URLs:

```astro
<Link href='/docs/guide.pdf' download>
  {dictionary.navigation.documentation}
</Link>
<Link href='/img/logo.svg' localize={false}>
  {dictionary.site.name}
</Link>
```

Example paths must point to real project resources.

## Target, rel, and accessibility

Target='_blank' adds noopener if absent while preserving other rel tokens.
Pass noreferrer explicitly when the referrer should also be withheld.
The component does not invent an aria-label: its slot or a translated label
must describe the destination. Use href for anchor navigation and native buttons
for actions or submissions.

With [PageLoader](../PageLoader/README.md), pass data-page-loader-skip to omit
the indicator for a link. Classes and Astro scope attributes are forwarded to
the anchor element.
