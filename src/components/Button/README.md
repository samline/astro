# Button

A small Tailwind primitive for native actions and styled navigation. It uses the
project's accent tokens, has no built-in text or client runtime, and leaves
application behavior with its consuming section.

## Availability and placement

Included in every generated project at `src/components/Button/index.astro`.
Use it from a section or reusable content component. Save this example as
`src/sections/NavigationActions/index.astro` and render it inside Main.

## Complete example

```astro
---
import Button from '@/components/Button/index.astro'
import { getDictionary } from '@/i18n'

const { buttons } = getDictionary(Astro.currentLocale)
---

<div class='flex flex-wrap gap-3'>
  <Button href='/'>{buttons.backHome}</Button>
  <Button type='button' variant='secondary' size='sm' disabled>
    {buttons.cancel}
  </Button>
</div>
```

Expected result: an accent-colored homepage **link** and a compact, disabled
outline **button**. The link navigates; the disabled button does nothing. Removing
`disabled` does not invent a cancel handler: attach project behavior explicitly.

## Choosing props

| Prop              | Default   | When to change it                                                              |
| ----------------- | --------- | ------------------------------------------------------------------------------ |
| `variant`         | `primary` | `secondary` for the less prominent action; `text` for a text action.           |
| `size`            | `md`      | `sm` for compact controls; `lg` for a more prominent action.                   |
| `href`            | Omitted   | Set for navigation; output delegates to Link.                                  |
| `type`            | `button`  | Use `submit` or `reset` for a real form operation. Button mode only.           |
| `disabled`        | `false`   | Disable a native action button. Not accepted in link mode.                     |
| `localize`        | `true`    | Link mode only; `false` preserves a resolved URL or public resource path.      |
| Native attributes | —         | Attributes for the selected element, including form, ARIA and data attributes. |
| Default slot      | —         | Translated label and optional decorative icon.                                 |

A submit control belongs inside a form, or points to one with its native `form`
attribute. With Button and `buttons` already in scope:

```astro
<Button type='submit' form='contact-form' class='w-full'>
  {buttons.submit}
</Button>
```

This fragment requires an actual `<form id='contact-form'>` and submission
handling. Button does not create an Action, SMTP service, request, or success
message. See [Fields](../Fields/README.md) if that integration is installed.

## Styling and accessibility

Change project-wide colors in `src/styles/tailwind.css`. `class` works well for
layout such as `w-full`; when changing the visual design, edit the component's
variant/size maps instead of stacking conflicting color utilities. Tailwind
class conflicts are not resolved by a merge library.

Use a visible translated label. For an icon-only action, name the button using a
translated `aria-label` and leave its child icon decorative. Focus is visible,
disabled buttons are dimmed, and transitions respect reduced motion.

There is no loading prop, event bus, implicit click handler or locale prop.
Native form attributes are forwarded. In link mode, [Link](../Link/README.md)
owns URL localization, `download`, `target` and `rel` behavior.

Use [Astro scripts and event handling](https://docs.astro.build/en/guides/client-side-scripts/)
when your section needs browser behavior.

Text actions use the same accent palette, native button semantics and focus
outline. All variants include active feedback and style explicit `aria-pressed`
state; the owning section must update that attribute and implement its behavior.
The resolved native `type` is rendered once after forwarded attributes so submit
and reset controls retain their requested operation.
