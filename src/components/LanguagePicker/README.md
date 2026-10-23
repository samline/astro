# LanguagePicker

Navigation between active locales for the same route. Reads Astro.currentLocale
internally and uses native links without client JavaScript.

## Usage

```astro
---
import LanguagePicker from '@/components/LanguagePicker/index.astro'
---

<LanguagePicker path='/' />
```

| Prop           | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `path: string` | Required. Locale-free route, such as / or /contact. |

There is no locale prop, callable method API, slot, or arbitrary attribute
forwarding. Path must exist in the active locales. The component generates URLs
with Astro helpers; it does not create pages or translate slugs.

## Locales and labels

Renders nothing when only one locale is enabled. `src/i18n/config.ts` controls
active locales: en-us is the default and en-mx is prepared but commented out.
When enabling another locale, check its routes and dictionaries. `en-mx` means
English for Mexico, not Spanish.

Visible names come from dictionary.languages and the navigation label from
common.language. The current locale link receives aria-current='page'; each
link declares lang and hreflang. Resolved URLs are passed to Link with
localize={false} to avoid adding a second prefix.

## Styling

Renders nav, ul, li, and Link without its own styles. Style it from its composing
component; no class prop is forwarded to nav. If reusable customization is needed,
explicitly extend its contract in the project.
