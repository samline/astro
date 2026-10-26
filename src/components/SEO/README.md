# SEO

Document metadata for the starter. Included in every generated project at
`src/components/SEO/index.astro`. Main mounts it once in the head and forwards its
props. Configure a page through Main; do not add a second SEO instance.

## Complete page composition

First create a real section at `src/sections/Overview/index.astro`:

```astro
---
import Section from '@/components/Section/index.astro'
import Box from '@/components/Box/index.astro'
import H from '@/components/H/index.astro'
import { getDictionary } from '@/i18n'

const { site } = getDictionary(Astro.currentLocale)
---

<Section id='overview' aria-labelledby='page-title'>
  <Box>
    <H level={1} id='page-title'>
      {site.title}
    </H>
    <p>{site.description}</p>
  </Box>
</Section>
```

Then use it from `src/pages/[...locale]/index.astro`. Preserve the existing
homepage's locale path generation when replacing its section:

```astro
---
import Main from '@/layouts/Main.astro'
import Overview from '@/sections/Overview/index.astro'
import { getDictionary } from '@/i18n'
import { defaultLocale, locales } from '@/i18n/config'

export const getStaticPaths = () =>
  locales.map((locale) => ({
    params: { locale: locale === defaultLocale ? undefined : locale }
  }))

const { site } = getDictionary(Astro.currentLocale)
---

<Main path='/' title={site.title} description={site.description}>
  <Overview />
</Main>
```

Expected result: one document title and description in the current language, plus
the starter's Open Graph, Twitter, favicon and indexing metadata. Canonical,
hreflang and JSON-LD are emitted only when indexing is enabled. These examples use
core dictionary keys and require no Welcome feature or social image file.

Main owns the document and main landmark; pages compose sections. For page-specific
copy, add the appropriate domain contract and translations before referencing new
keys. Copy comes from dictionaries or already translated content, not environment
variables. This component has no browser methods or client JavaScript.

## Props

| Prop                                                  | Default                 | Purpose                                                                          |
| ----------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| `path: string`                                        | Required                | Route without locale prefix, query, or hash. Astro resolves URLs for the locale. |
| `title?: string`                                      | site.title              | Title; applies seo.titleTemplate when appropriate.                               |
| `titleAbsolute?: string`                              | —                       | Complete title overriding title and bypassing the template.                      |
| `description?: string`                                | site.description        | Page description.                                                                |
| `type?: 'website' \| 'article'`                       | `'website'`             | Open Graph type.                                                                 |
| `noindex?: boolean`                                   | false                   | Excludes this page from indexing; cannot override disabled global indexing.      |
| `nofollow?: boolean`                                  | false                   | Adds nofollow to robots.                                                         |
| `alternateLocales?: Locale[]`                         | Active locales          | Only locales where this page exists, filtered against active configuration.      |
| `image?: SocialImage \| null`                         | Configured global image | Omit to use the global image; null disables it for this page.                    |
| `canonical?: string \| URL`                           | Localized path URL      | Overrides the main URL; use HTTP(S).                                             |
| `structuredData?: StructuredData \| StructuredData[]` | []                      | Additional nodes for the JSON-LD graph.                                          |

`Props` is exported from index.astro. SocialImage, StructuredData, and JsonValue
are exported from src/config/seo.ts.

### Social image

SocialImage requires src and alt; width, height, and type are optional. Src may
be site-relative or an HTTP(S) URL. Alt must be translated.

```astro
<Main
  path='/'
  image={{
    src: '/img/social.jpg',
    alt: dictionary.seo.imageAlt,
    width: 1200,
    height: 630,
    type: 'image/jpeg'
  }}
>
  <Overview />
</Main>
```

This is a page customization fragment: it reuses the imports/dictionary from the
complete example and requires `public/img/social.jpg` to exist before use. The component does not
generate or optimize that image.

### Structured data

Generates WebPage and, on the default locale's homepage, WebSite. StructuredData
adds nodes to the same graph without replacing defaults. Use JSON-compatible
objects without functions or circular references. Choose Schema.org types that
match actual content. `type='article'` only changes Open Graph; it does not create
an Article node by itself.

## Shared configuration

`src/config/seo.ts` defines the global image, Twitter accounts, Apple icon,
manifest, and noindexPaths. Translated labels live in the site and seo domains.
SITE_URL defines the origin; SITE_INDEXABLE controls indexing at build time.
When unspecified, configuration detects production, local origins, and
Vercel/Netlify previews.

When a page is not indexable, SEO emits noindex and omits canonical, hreflang
alternatives, and JSON-LD. `noindexPaths` is shared with the sitemap filter; add
permanent exclusions there as well as considering per-page props. Individual
page noindex props do not discover or update sitemap routes automatically.

SEO also emits Open Graph, Twitter Cards, and favicons. Public resource links
must exist. Theme-color belongs to Main and should match Tailwind's main accent.

## Localized content and framework boundaries

The default `path`/`alternateLocales` contract assumes the same locale-free path
exists in every listed language. Passing `alternateLocales` filters locales; it
does not supply their different slugs. For translated API/CMS routes, adapt SEO
and LanguagePicker together using the real destination mapping described in
[localized content](../../i18n/localized-content.md). Do not advertise invented
alternates or listing fallbacks as equivalent articles.

Dynamic route generation, URL helpers and layouts belong to Astro. Refer to
[Astro routing](https://docs.astro.build/en/guides/routing/),
[Astro i18n](https://docs.astro.build/en/guides/internationalization/) and
[Astro layouts](https://docs.astro.build/en/basics/layouts/) for those APIs. This
README documents the metadata decisions added by the distribution.
