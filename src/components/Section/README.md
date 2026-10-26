# Section

A semantic `section` with a required anchor and optional vertical rhythm. Use it
at the root of a domain section such as Overview or Contact. It does not constrain
width or insert Box automatically, and ships no browser JavaScript.

## Availability and placement

Included in every generated project at `src/components/Section/index.astro`.
The reusable wrapper lives in `components`; an actual Overview belongs in
`src/sections/Overview/index.astro`. Render Overview from a page inside Main.

## Complete section example

```astro
---
import Section from '@/components/Section/index.astro'
import Box from '@/components/Box/index.astro'
import H from '@/components/H/index.astro'
import { getDictionary } from '@/i18n'

const { site } = getDictionary(Astro.currentLocale)
---

<Section id='overview' aria-labelledby='overview-title'>
  <Box>
    <H level={2} id='overview-title' class='text-2xl font-semibold'>
      {site.title}
    </H>
    <p>{site.description}</p>
  </Box>
</Section>
```

Expected result: a section addressable with `#overview`, named by its real heading,
with centered content and responsive block padding. Choose the heading level from
the page outline; Section does not create or infer one. IDs must be unique within
the page, including when a section is rendered twice.

## API

| Prop                      | Default  | Purpose                                                |
| ------------------------- | -------- | ------------------------------------------------------ |
| `id: string`              | Required | Page-unique anchor.                                    |
| `padded: boolean`         | `true`   | Apply the default responsive block padding.            |
| Native section attributes | —        | `class`, `style`, `aria-*`, `data-*`, etc.             |
| Default slot              | —        | Any section content, including multiple Box instances. |

`aria-labelledby` must reference a real heading. Where an accessible name is
needed without a visible heading, provide a translated `aria-label`. Native and
Astro scope attributes are forwarded to the section.

## Spacing and fixed headers

The default block padding is **2.5rem**, **4rem at 48rem** viewport width, and
**5rem at 64rem**. Box controls width independently.

| CSS property              | Default                 | Effect                                                   |
| ------------------------- | ----------------------- | -------------------------------------------------------- |
| `--section-padding-block` | Responsive values above | Override padding at every breakpoint.                    |
| `--section-scroll-offset` | `0`                     | Set `scroll-margin-block-start` for anchored navigation. |

A fixed header can use `class='[--section-scroll-offset:5rem]'`.
For Tailwind-owned spacing instead, disable the default padding:

```astro
<Section id='details' padded={false} class='py-8 md:py-16'>
  <slot />
</Section>
```

This fragment assumes Section is imported in a wrapper component. `padded={false}`
disables the default padding and `--section-padding-block`; the scroll offset still
works. Do not add another `main` landmark inside Section: Main owns that landmark.

[Box](../Box/README.md) documents content widths. Component props and slots remain
native [Astro components](https://docs.astro.build/en/basics/astro-components/).
