# Section

Semantic section with an anchor and vertical spacing. Does not constrain content
width or insert a Box automatically. Requires no client JavaScript.

## Usage

Example inside a component in src/sections:

```astro
---
import Section from '@/components/Section/index.astro'
import Box from '@/components/Box/index.astro'
import { getDictionary } from '@/i18n'
const dictionary = getDictionary(Astro.currentLocale)
---

<Section id='overview' aria-labelledby='overview-title'>
  <Box>
    <h2 id='overview-title'>{dictionary.site.title}</h2>
    <slot />
  </Box>
</Section>
```

## Props and slot

| Prop                      | Default  | Purpose                                              |
| ------------------------- | -------- | ---------------------------------------------------- |
| `id`                      | Required | Unique anchor within the page.                       |
| `padded`                  | `true`   | Adds the default vertical spacing.                   |
| Native section attributes | —        | Classes, styles, accessibility, and data attributes. |
| Default slot              | —        | Content, optionally containing one or more Boxes.    |

Point aria-labelledby to a real heading or provide a translated label when
appropriate. An id does not generate a heading automatically.

## Spacing

With padded enabled, block padding is 2.5rem, increasing to 4rem at a 48rem viewport
and 5rem at 64rem. Section controls vertical spacing; Box controls content width.

| CSS property              | Purpose                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| `--section-padding-block` | Overrides padding at every breakpoint.                           |
| `--section-scroll-offset` | Sets scroll-margin-block-start for fixed headers; defaults to 0. |

```astro
<Section
  id='details'
  style='--section-padding-block: 3rem; --section-scroll-offset: 5rem;'
>
  <slot />
</Section>
```

Use padded={false} when defining custom padding, for example with
class='py-8 md:py-16'. This also disables --section-padding-block; the scroll
offset remains available.
