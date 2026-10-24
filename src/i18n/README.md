# Dictionaries and browser copy

`getDictionary(Astro.currentLocale)` is the server-rendering entry. Dictionaries
remain modular under each locale/domain, with index.ts and types.ts per domain.
Normal components read their own Astro locale. Server Islands receive locale
explicitly because their request is isolated. This feature adds no custom router.

## Optional browser payload

When a section needs several translated browser messages, configure Main:

```astro
<Main clientTranslations={['forms', 'buttons']}>
  <ContactSection />
</Main>
```

The default empty array emits no payload. Domains are typed dictionary keys and
deduplicated. Main emits one inert application/json script with
`id="kit-translations"` and `{ locale, translations }`. Only the selected domains
for the active locale are included. HTML-sensitive opening brackets are escaped
so dictionary text cannot terminate the script. This is public UI data, never a
place for environment values, credentials or private API responses.

Read it in the owning section's processed browser script:

```ts
import type { ClientTranslations } from '@/i18n/types'

const setup = () => {
  const node = document.getElementById('kit-translations')
  if (!node?.textContent) return
  const { locale, translations } = JSON.parse(
    node.textContent
  ) as ClientTranslations<'forms' | 'buttons'>
  // Wire this section's UI with translations.forms and translations.buttons.
}
setup()
document.addEventListener('astro:page-load', setup)
```

Choose the same domains in Main and the type argument. The static type is a
consumer contract, not validation of arbitrary external JSON. Read the current
DOM after each navigation; do not cache a dictionary globally across locales.
Own listener cleanup/idempotency in the consuming section as usual.

There is no Base64 conversion, window dictionary, new client helper or default
whole-dictionary download. Existing components using a few data attributes can
keep doing that without enabling this payload. Importing getDictionary directly
in browser code remains possible but includes the dictionaries in that bundle;
prefer this scoped payload when the section only needs a few domains.
