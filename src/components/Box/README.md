# Box

Centers content and limits its width. It adds no background, border, vertical
spacing, or section semantics. Renders a div and needs no client JavaScript.

## Usage

```astro
---
import Box from '@/components/Box/index.astro'
---

<Box size='narrow' class='flex flex-col gap-6'>
  <slot />
</Box>
```

## Props and slot

| Prop                  | Default     | Purpose                                                                            |
| --------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `size`                | `'default'` | Default: maximum 90rem; narrow: 48rem; wide: 120rem; fluid: no maximum.            |
| Native div attributes | —           | class, style, id, aria-_, data-_, and other attributes forwarded to the container. |
| Default slot          | —           | Container content.                                                                 |

Fills the available width with 1.25rem inline gutters. The maximum includes those
gutters. Caller classes are merged with component classes and Astro scope attributes
are forwarded.

## CSS properties

```astro
<Box style='--box-max-width: 64rem; --box-gutter: 2rem;'>
  <slot />
</Box>
```

--box-max-width overrides the maximum for any size, including fluid. --box-gutter
changes inline padding. Use Tailwind utilities or section styles to set these
properties responsively.

Usually placed inside [Section](../Section/README.md). One Section can contain
multiple Boxes or combine constrained content with full-width blocks.
