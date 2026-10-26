# LanguagePicker

Navigation between active locales for the same route. Reads Astro.currentLocale
internally and uses native links without client JavaScript.

## Availability and placement

Optional installer selection: `language-picker`. Add it later with
`npx @samline/astro add language-picker`. This adds the component and language
labels; it does not automatically activate another language or add a header.
The implementation is `src/components/LanguagePicker/index.astro`.

On initial creation with both `welcome` and `language-picker`, the starter demo
mounts it in `src/sections/DemoHeader`. The header passes the current demo path
so switching languages preserves Home or `/demo`. Adding the feature later
makes it available for your own section; it preserves existing header source.

**With one active locale, the component intentionally renders nothing.**
Selecting the feature and selecting active languages are separate decisions.

## Complete section example

Use this inside a section such as `src/sections/LanguageNavigation/index.astro`:

```astro
---
import LanguagePicker from '@/components/LanguagePicker/index.astro'
---

<div class='[&_a]:underline [&_ul]:flex [&_ul]:flex-wrap [&_ul]:gap-4'>
  <LanguagePicker path='/' />
</div>
```

Expected result: one link per active locale, pointing to that language's
homepage, with the current language marked `aria-current='page'`. With the default
single-language configuration there is no nav element, which is not an error.

| Prop           | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `path: string` | Required. Locale-free route, such as / or /contact. |

There is no locale prop, callable method API, slot, or arbitrary attribute
forwarding. Path must exist in the active locales. The component generates URLs
with Astro helpers; it does not create pages or translate slugs.

## Locales and labels

Renders nothing when only one locale is enabled. `src/i18n/config.ts` controls
the active `locales` array. The default and available languages are
chosen during installation.
To add a language that is absent from the project, use `locale add` through the
installer first, for example `npx @samline/astro locale add es-mx`. That command
creates the current dictionary keys with empty values and keeps the locale
inactive. Fill those values, review routes and run `bun run check:i18n` after
explicitly adding the finished locale to the active array in `src/i18n/config.ts`.
If it was selected during creation, the preset dictionaries already exist. `es-mx` means Spanish for Mexico; `es-es` means Spanish for Spain. Generated projects include only selected
languages; read src/i18n/config.ts for the actual default and active list.

Visible names come from dictionary.languages and the navigation label from
common.language. The current locale link receives aria-current='page'; each
link declares lang and hreflang. Resolved URLs are passed to Link with
localize={false} to avoid adding a second prefix.

## Styling

Renders nav, ul, li, and Link without its own styles. Style it from its composing
component; no class prop is forwarded to nav. If reusable customization is needed,
explicitly extend its contract in the project.

## Translated content and limits

Use `path='/contact'` only if `/contact` exists in every active language.
A post at `/posts/hello` and its Spanish translation at `/posts/hola` **cannot**
share the single `path` contract. Before using this component for that content,
implement the provider mapping described in
[localized content](../../i18n/localized-content.md), and adapt LanguagePicker and
SEO together to consume the real available destinations. The current component
does not make that mapping, hide missing translations, or probe URLs.

URL prefixes and trailing-slash behavior belong to
[Astro i18n](https://docs.astro.build/en/guides/internationalization/) and
[Astro URL helpers](https://docs.astro.build/en/reference/modules/astro-i18n/).
