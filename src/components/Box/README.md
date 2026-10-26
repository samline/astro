# Box

A centered content-width container. Use it to align a section's content with the
rest of the page. It renders one `div`, adds inline gutters, and needs no browser
JavaScript. It does not create a card, a semantic section, or vertical spacing.

## Availability and placement

Included in every generated project at `src/components/Box/index.astro`.
Pages compose `Main` and domain sections; sections compose reusable components.
Put the following example in `src/sections/Overview/index.astro`, then render that
section inside your page's `Main` layout.

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
  <Box size='narrow' class='space-y-4'>
    <H level={1} id='overview-title' class='text-3xl font-bold'>
      {site.title}
    </H>
    <p>{site.description}</p>
  </Box>
</Section>
```

Expected result: a named section with vertical spacing and centered text in a
container up to **48rem** wide. The section owns the spacing; Box owns the width.
Use `level={2}` if the page already has its primary heading.

## Choosing a size

| `size`              | Maximum width | Use when                                                |
| ------------------- | ------------- | ------------------------------------------------------- |
| `default` (default) | 90rem         | Normal site sections and multi-column layouts.          |
| `narrow`            | 48rem         | Forms, article introductions, and focused reading.      |
| `wide`              | 120rem        | Large grids that need more horizontal room.             |
| `fluid`             | None          | Content should fill its parent while retaining gutters. |

All sizes fill the available width and use **1.25rem inline gutters**. The maximum
includes the gutters. A narrow parent still limits a fluid Box. Nesting Boxes
adds their gutters; use siblings when you need independent widths in one section.

## API and customization

Accepts native `div` attributes, including `id`, `class`, `style`, `aria-*` and
`data-*`. Attributes and Astro scope attributes reach the rendered container.
The default slot is its content; there are no named slots or client methods.

| CSS property      | Default     | Effect                                       |
| ----------------- | ----------- | -------------------------------------------- |
| `--box-max-width` | Chosen size | Override the maximum, including for `fluid`. |
| `--box-gutter`    | `1.25rem`   | Override inline padding.                     |

For a one-off responsive width, keep the change with its section:

```astro
<Box class='[--box-gutter:1rem] md:[--box-gutter:2rem]'>
  <slot />
</Box>
```

This last fragment assumes Box is already imported; its slot forwards a wrapper
component's content. Do not add backgrounds, borders or block padding to Box's
base contract: apply those to the owning content component or section.

[Section](../Section/README.md) documents the spacing wrapper. Props, slots and
component rendering follow [Astro components](https://docs.astro.build/en/basics/astro-components/).
