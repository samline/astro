# FaIcon

Renders an imported Font Awesome icon definition as inline SVG during Astro
rendering. No browser JavaScript, DOM observer, font files, CDN, icon registry,
or SVG Core runtime is required. The base includes the free Solid, Regular,
and Brands packages.

## Availability and placement

Optional installer selection: `faicon`. If omitted, add it from the generated
project with `npx @samline/astro add faicon`. This adds the component and its free
icon-definition packages; manually copying only this folder is not sufficient.

The implementation is `src/components/FaIcon/index.astro`. Put the following
example in a section's content component, such as
`src/sections/Navigation/BackLink.astro`, then compose it inside your section.

## Complete example

```astro
---
import FaIcon from '@/components/FaIcon/index.astro'
import Button from '@/components/Button/index.astro'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft'
import { faHeart } from '@fortawesome/free-regular-svg-icons/faHeart'
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub'
import { getDictionary } from '@/i18n'

const dictionary = getDictionary(Astro.currentLocale)
---

<Button href='/'>
  <FaIcon icon={faArrowLeft} />
  {dictionary.buttons.backHome}
</Button>
<FaIcon icon={faHeart} class='text-2xl text-accent' />
<FaIcon icon={faGithub} class='text-xl' />
```

Expected result: a localized Back to home link with a decorative left arrow,
plus two decorative icons. The arrow shares the link's color; changing `text-*`
changes the SVG color/size. None of these icons runs a browser script.

The last two examples are decorative. Import individual definitions; do not
import the complete fas, far, or fab collections. The definition carries its
family and style, so there is no lib prop or string-name lookup. Deep imports
also avoid loading an entire package entry point while building.

## API

| Prop                  | Default  | Purpose                                                            |
| --------------------- | -------- | ------------------------------------------------------------------ |
| `icon`                | Required | Imported Font Awesome IconDefinition.                              |
| `label`               | —        | Translated accessible name for an informative standalone icon.     |
| `class`               | —        | Size with text-* or h-_/w-_ utilities; color with text-*.          |
| Native SVG attributes | —        | id, width, height, style, data-* and other non-managed attributes. |

The default height is 1em and width preserves the icon's aspect ratio. Dimensions
are native SVG attributes, so CSS utilities can override them. The icon inherits
currentColor. Native attributes and Astro scope attributes reach the SVG.
The component owns viewBox, role, aria-hidden, aria-label, aria-labelledby, and
focusable to keep geometry and accessible naming consistent. No slots or client
methods are exposed.

## Accessibility and translations

Without a nonempty label, the SVG is aria-hidden and decorative. This is the
default for icons alongside visible text. With label, the SVG receives role=img
and aria-label and is exposed to assistive technology. All label values must
come from the caller's dictionary; the component needs no locale prop.

For an icon-only Button or Link, put the translated aria-label on that interactive
element and leave the icon decorative. Naming the SVG does not replace naming
its enclosing control. Icons are never separate keyboard controls.

For an icon-only homepage link, put its accessible name on the control:

```astro
<Button href='/' aria-label={dictionary.buttons.backHome}>
  <FaIcon icon={faArrowLeft} />
</Button>
```

This fragment reuses the imports/dictionary above. For a standalone informative
icon, `label` must come from an appropriate translated key; do not label a
cosmetic icon that sits beside equivalent visible text.

## Limits and migration

Replace icon='arrow-left' with icon={faArrowLeft} and remove lib. Replace old
fa-* styling classes with Tailwind utilities. Font Awesome CSS helpers, animation,
transforms, masks, counters, and automatic replacement of i tags are not included.
The base targets free single-color icons. Definitions containing several paths
render all paths using the same fill; commercial duotone styling is not provided.
Additional licensed packages can be installed in a future project and passed as
definitions without changing this component.

Font Awesome package licenses still apply to the rendered icons. Keep the package
license files and review the relevant licenses when redistributing icon assets.

SVG output is server-rendered through [Astro components](https://docs.astro.build/en/basics/astro-components/).
