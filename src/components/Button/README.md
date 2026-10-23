# Button

Minimal button styling for actions and navigation. Uses the project's Tailwind
accent tokens, requires no client JavaScript, and adds no default text.

## Usage

```astro
---
import Button from '@/components/Button/index.astro'
import { getDictionary } from '@/i18n'

const dictionary = getDictionary(Astro.currentLocale)
---

<Button type='submit'>{dictionary.buttons.submit}</Button>
<Button type='button' variant='secondary' disabled>
  {dictionary.buttons.cancel}
</Button>
<Button href='/' size='sm'>
  {dictionary.buttons.backHome}
</Button>
```

## API

| Prop              | Default   | Purpose                                                                      |
| ----------------- | --------- | ---------------------------------------------------------------------------- |
| `variant`         | `primary` | Solid accent or outlined `secondary`.                                        |
| `size`            | `md`      | `sm`, `md`, or `lg`; controls padding, text, and minimum height.             |
| `href`            | —         | Renders Link when provided; otherwise renders a native button.               |
| `type`            | `button`  | Use `submit` or `reset` explicitly for form actions.                         |
| `disabled`        | `false`   | Native disabled behavior, available only without href.                       |
| `localize`        | `true`    | Link-only option; see the Link documentation.                                |
| Native attributes | —         | Attributes for the selected element, including class, id, aria-* and data-*. |
| Default slot      | —         | Translated label, optionally with decorative icons.                          |

Native form attributes such as form, name, value, and formaction are forwarded.
With href, Link retains its localization, download, and target/rel behavior.
TypeScript separates link and button attributes; links do not support disabled.
Hide an unavailable destination or render a disabled action button instead.

Use a visible translated label. For an icon-only action, supply a translated
aria-label and mark decorative icons aria-hidden='true'. Keep all visitor-facing
text in dictionaries; there is no locale prop. Focus is visible, disabled buttons
are dimmed, and color transitions respect reduced-motion preferences.

Customize project-wide colors in src/styles/tailwind.css. Use class for layout
utilities such as w-full. Edit this component's variant and size maps when
establishing a new project's design; conflicting Tailwind utilities are not merged.
There is no loading state, event system, or built-in click handler. Attach behavior
using a normal Astro client script and native DOM events when needed.

See [Link](../Link/README.md) for URL localization rules.
