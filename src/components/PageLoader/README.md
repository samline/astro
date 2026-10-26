# PageLoader

Global indicator for navigation and asynchronous operations. Optional installer
selection: `pageloader`. Add it later with `npx @samline/astro add pageloader`.
The installer includes `ldrs` and mounts the component once inside Main's body.
Using that generated Main layout is enough; do not mount a second loader.

## Files

| File          | Responsibility                                        |
| ------------- | ----------------------------------------------------- |
| `index.astro` | Overlay, translated status label, and ldrs animation. |
| `scripts.ts`  | Client API and navigation event handlers.             |

## Complete section example

Use this at `src/sections/LoaderNavigation/index.astro`, inside the generated Main
layout. Main already owns the single PageLoader instance:

```astro
---
import Link from '@/components/Link/index.astro'
import { getDictionary } from '@/i18n'

const { buttons } = getDictionary(Astro.currentLocale)
---

<Link href='/?from=loader-example' class='text-accent underline'>
  {buttons.backHome}
</Link>
```

Expected result: a normal localized homepage link with a query parameter. A
navigation to a different path/query starts the delayed indicator; a fast
navigation may finish before it becomes visible. Clicking the exact current
path/query again does not start it. The query example needs no new route/backend.

For a custom layout, import `@/components/PageLoader/index.astro` and mount
`<PageLoader />` once inside its body, outside its `main`. Preserve that layout's
SEO, language, styles and other document configuration; do not render a second
loader from a section.

Accepts native div attributes, including class, style, aria-* and data-*.
It controls hidden, role='status', and aria-live='polite' internally.
There are no duration, progress, or locale props, and no content slot.
The status label uses `common.loading` with `Astro.currentLocale`.

## Client API

Import the helpers in an Astro-processed script or another client module.
The module uses window and document: do not import it in frontmatter or server code.

| Function       | Returns | Behavior                                                                                        |
| -------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `showLoader()` | `void`  | Schedules the indicator after 250ms. Does nothing if already active or the component is absent. |
| `hideLoader()` | `void`  | Cancels its timers and hides the indicator immediately.                                         |

To wrap an existing async operation, keep this helper in the consuming section's
browser module, for example `src/sections/Contact/scripts.ts`:

```ts
import { showLoader, hideLoader } from '@/components/PageLoader/scripts'

export const withPageLoader = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  showLoader()
  try {
    return await operation()
  } finally {
    hideLoader()
  }
}
```

Call `withPageLoader(() => yourExistingAsyncOperation())` from that section's
actual event handler. This generic helper deliberately does not invent an API
endpoint. It preserves the operation's result/error; your section still owns
translated success/error feedback and duplicate-submission handling.

Expected result: operations shorter than 250ms show no overlay. Longer operations
show it until the operation finishes, unless the 10-second safety timeout hides it
first. An absent mounted component makes `showLoader()` a no-op.

This is a shared indicator without an operation counter: hideLoader hides it for
every caller. Coordinate concurrent operations before hiding it. Repeating
showLoader does not restart the delay or safety timeout.

## Automatic navigation

Activates for internal links to a different path or query and native form
submissions to the same origin. Ignores same-page anchors, downloads, external
URLs, new tabs, modified clicks, and cancelled events. Respects target, the base
target, and submitter overrides. It does not automatically track fetch requests,
Server Islands, or background work.

To skip an individual link or form:

```astro
<Link href='/' data-page-loader-skip>
  {dictionary.buttons.backHome}
</Link>
```

This fragment assumes Link and the current dictionary are imported in your section;
`/` is the existing homepage.
For asynchronous forms that cancel native submission, call the API explicitly.

With ClientRouter, handles astro:before-preparation and astro:page-load, cleaning
up after successful or failed preparation. It does not install that router.
`pageshow` and `pagehide` reset history navigation state. No beforeunload handler is used.

## Animation and styling

The overlay uses Tailwind, accent tokens, and dark variants. It does not block
controls or move focus. Without JavaScript it stays hidden. Reduced-motion users
see a static circle instead of the animation.

To replace ping, change these together in index.astro:

1. The ldrs import, for example `import { ring } from 'ldrs'`.
2. Registration, for example `ring.register()`.
3. The element, for example `<l-ring size='80' color='var(--color-accent)' />`.

Keep aria-hidden='true' and motion-reduce:hidden on the animation, along with
the static alternative. Size and speed are ldrs attributes; use Tailwind classes
for the overlay. Only the selected animation is imported.

## Timing and limits

`scripts.ts` defines a 250ms delay and a 10-second safety timeout. The timeout
only hides the UI; it does not cancel the operation. There is no simulated
progress percentage or minimum visible duration.

Automatic script processing and optional navigation lifecycle behavior are owned
by [Astro scripts](https://docs.astro.build/en/guides/client-side-scripts/) and
[Astro view transitions](https://docs.astro.build/en/guides/view-transitions/).
