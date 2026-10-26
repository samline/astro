# H

A semantic heading primitive. Renders `h1` through `h6` without a wrapper, imposed
typography, or browser JavaScript. Its level describes the document outline;
Tailwind classes describe its visual appearance.

## Availability and placement

Included in every generated project at `src/components/H/index.astro`.
Use it inside section content. The following can be the body of
`src/sections/Introduction/index.astro`, rendered by a page inside Main.

## Complete example

```astro
---
import H from '@/components/H/index.astro'
import { getDictionary } from '@/i18n'

const { site } = getDictionary(Astro.currentLocale)
---

<H level={1} id='page-title' class='text-4xl font-bold md:text-6xl'>
  {site.title}
</H>
<p>{site.description}</p>
```

Expected result: an actual `h1`, with the current dictionary's title and the given
ID/classes. There is no `level` attribute on the output. H does not read a locale
prop or supply a default heading label.

## API

| Prop                      | Default  | Purpose                                          |
| ------------------------- | -------- | ------------------------------------------------ |
| `level`                   | Required | Integer `1`, `2`, `3`, `4`, `5`, or `6`.         |
| Native heading attributes | —        | `id`, `class`, `style`, `aria-*`, `data-*`, etc. |
| Default slot              | —        | Translated text, optionally with inline markup.  |

Choose one primary heading for the page and nest section headings in a logical
order. A visually small page title can still use `level={1}`. A visually large
section title can use `level={2}`. H never infers a level from nesting or generates
an ID. Invalid levels throw during rendering.

To name a section, match its `aria-labelledby` to the heading's unique `id`:

```astro
<Section id='overview' aria-labelledby='overview-title'>
  <Box>
    <H level={2} id='overview-title' class='text-3xl font-semibold'>
      {site.title}
    </H>
  </Box>
</Section>
```

This composition fragment assumes Section, Box and H are imported and `site` was
read from the dictionary as above. Keep heading text in the owning domain's
translations; there is no `children` prop or client API.

For props and slots, use [Astro's component documentation](https://docs.astro.build/en/basics/astro-components/).
