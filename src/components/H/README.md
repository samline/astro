# H

Semantic heading primitive. Renders h1 through h6 with no added styles, wrapper,
or client JavaScript. Use class utilities to establish a project's typography.

## Usage

```astro
---
import H from '@/components/H/index.astro'
import { getDictionary } from '@/i18n'

const dictionary = getDictionary(Astro.currentLocale)
---

<H level={1} id='not-found-title' class='text-3xl font-bold'>
  {dictionary.errors.notFound.title}
</H>
```

## API

| Prop                      | Default  | Purpose                                                      |
| ------------------------- | -------- | ------------------------------------------------------------ |
| `level`                   | Required | Semantic heading level: 1, 2, 3, 4, 5, or 6.                 |
| Native heading attributes | —        | id, class, style, aria-_, data-_, and other HTML attributes. |
| Default slot              | —        | Translated heading content, optionally with inline markup.   |

Choose level from the document hierarchy, independently of the visual text size.
Use one h1 for the page title and nest section headings in a logical order.
H does not infer levels from Section nesting or generate an id. To label a Section,
set its aria-labelledby to this heading's unique id.

All six levels share the same attribute contract. Custom props are consumed;
native attributes and Astro scope attributes reach the heading element. Invalid
levels throw during rendering instead of producing an unknown HTML element.
There is no children prop: content belongs in the default slot. Text comes from
the calling component's dictionary; H requires no locale prop.

The global base stylesheet owns text wrapping and normalization. No heading
sizes, colors, margins, or typography variants are imposed here. Supply the
desired appearance with class.
