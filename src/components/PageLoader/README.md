# PageLoader

Global indicator for navigation and asynchronous operations. `Main.astro`
already mounts it once inside the body; using that layout is enough.

## Files

| File          | Responsibility                                        |
| ------------- | ----------------------------------------------------- |
| `index.astro` | Overlay, translated status label, and ldrs animation. |
| `scripts.ts`  | Client API and navigation event handlers.             |

## Integration

In a layout other than Main, place it inside the body, outside main:

```astro
---
import PageLoader from '@/components/PageLoader/index.astro'
---

<body>
  <PageLoader />
  <main>
    <slot />
  </main>
</body>
```

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

Complete example inside a component:

```astro
---
import { getDictionary } from '@/i18n'
const dictionary = getDictionary(Astro.currentLocale)
---

<button type='button' data-refresh>
  {dictionary.common.loading}
</button>

<script>
  import { showLoader, hideLoader } from '@/components/PageLoader/scripts'

  const refresh = async () => {
    showLoader()
    try {
      // Replace this URL with a real project endpoint.
      const response = await fetch('/api/refresh', { method: 'POST' })
      if (!response.ok) throw new Error('Refresh request failed.')
    } finally {
      hideLoader()
    }
  }

  document.querySelector('[data-refresh]')?.addEventListener('click', () => {
    void refresh().catch((error) => {
      // Display errors using the project's translated messages.
      console.error(error)
    })
  })
</script>
```

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
<Link href='/guide' data-page-loader-skip>
  {dictionary.navigation.documentation}
</Link>
```

This example assumes Link is imported and the route exists in your project.
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
