# SEO

Document metadata. Main.astro already includes it in the head and forwards its
props. Configure SEO through Main rather than mounting a second SEO instance.
There is no client JavaScript or browser method API.

## Usage from a page

```astro
---
import Main from '@/layouts/Main.astro'
import Welcome from '@/sections/Welcome/index.astro'
import { getDictionary } from '@/i18n'
const dictionary = getDictionary(Astro.currentLocale)
---

<Main
  path='/'
  title={dictionary.site.title}
  description={dictionary.site.description}
>
  <Welcome />
</Main>
```

Main contains the page's sections. SEO copy must come from dictionaries or
already translated content, not environment variables.

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

Props is exported from index.astro. SocialImage, StructuredData, and JsonValue
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
  <Welcome />
</Main>
```

This example assumes public/img/social.jpg exists. The component does not
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
