# Optional section-owned reveal recipe

This is a copyable recipe, not an installed integration or a mandatory animation
system. It needs no additional package. Adapt it only inside a section that owns
its reveal targets. Reuse an existing lifecycle owner when the project has one.
The first-observer pattern preserves initially visible content and adds focus,
hash, motion-change and cleanup handling.

## Controller

Create `src/sections/Overview/reveal.ts` with this complete module. Call setup
once for each wrapper, never on the track/panel another package animates. The
WeakMap makes repeated setup idempotent; each returned cleanup is safe to repeat.
A completed marker survives cleanup/remount on the same DOM node.

```ts
const mounted = new WeakMap<HTMLElement, () => void>()

export const setupReveal = (element: HTMLElement): (() => void) => {
  const existing = mounted.get(element)
  if (existing) return existing
  const events = new AbortController()
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let observer: IntersectionObserver | undefined
  let animation: Animation | undefined
  let initial = true
  let disposed = false

  const finish = () => {
    element.dataset.revealDone = 'true'
    delete element.dataset.revealPending
    observer?.disconnect()
    animation?.cancel()
    animation = undefined
  }
  const exposeHash = () => {
    let id: string
    try {
      id = decodeURIComponent(location.hash.slice(1))
    } catch {
      return
    }
    const target = document.getElementById(id)
    if (target && element.contains(target)) finish()
  }
  const cleanup = () => {
    if (disposed) return
    disposed = true
    finish()
    events.abort()
    mounted.delete(element)
  }
  mounted.set(element, cleanup)
  element.addEventListener('focusin', finish, { signal: events.signal })
  window.addEventListener('hashchange', exposeHash, { signal: events.signal })
  motion.addEventListener(
    'change',
    () => {
      if (motion.matches) finish()
    },
    { signal: events.signal }
  )

  if (
    element.dataset.revealDone ||
    motion.matches ||
    !('IntersectionObserver' in window) ||
    !element.animate ||
    element.contains(document.activeElement)
  ) {
    finish()
    return cleanup
  }
  exposeHash()
  if (element.dataset.revealDone) return cleanup

  observer = new IntersectionObserver(
    (entries) => {
      if (disposed || element.dataset.revealDone) return
      for (const entry of entries) {
        if (initial) {
          initial = false
          // Never hide content that the visitor could already have seen.
          if (
            entry.isIntersecting ||
            entry.boundingClientRect.top < innerHeight
          ) {
            finish()
            return
          }
          element.dataset.revealPending = 'true'
          continue
        }
        // Fast scrolling can pass a target between observer reports.
        if (entry.boundingClientRect.bottom <= 0) {
          finish()
          return
        }
        if (
          entry.isIntersecting ||
          entry.boundingClientRect.top < innerHeight
        ) {
          observer?.disconnect()
          delete element.dataset.revealPending
          animation = element.animate(
            [
              { opacity: 0, translate: '0 0.75rem' },
              { opacity: 1, translate: '0 0' }
            ],
            { duration: 600, easing: 'ease-out' }
          )
          animation.onfinish = finish
          return
        }
      }
    },
    {
      threshold: 0,
      rootMargin: `0px 0px ${4 * parseFloat(getComputedStyle(document.documentElement).fontSize)}px 0px`
    }
  )
  observer.observe(element)
  return cleanup
}
```

Only the temporary pending state hides content. Web Animations owns opacity and
individual translate during playback; cancellation/completion restores natural
styles without committing inline effects. Do not add a competing transition,
transform, delay or nested reveal. The observer's rootMargin API uses computed
pixels corresponding to 4rem, preserving enlarged root typography.

## Section integration

Create `src/sections/Overview/index.astro`. The existing core site dictionary
supplies its heading; replace that with this section's real dictionary content.
The page imports the section and composes it inside Main as usual.

```astro
---
import Section from '@/components/Section/index.astro'
import Box from '@/components/Box/index.astro'
import { getDictionary } from '@/i18n'
const dictionary = getDictionary(Astro.currentLocale)
---

<Section id='overview' aria-labelledby='overview-title'>
  <Box>
    <div data-overview-reveal>
      <h2 id='overview-title'>{dictionary.site.title}</h2>
    </div>
  </Box>
</Section>

<script>
  import { setupReveal } from './reveal'

  const roots = new Map<HTMLElement, () => void>()
  const events = new AbortController()
  const clear = () => {
    for (const cleanup of roots.values()) cleanup()
    roots.clear()
  }
  const mount = () => {
    for (const [element, cleanup] of roots) {
      if (!element.isConnected) {
        cleanup()
        roots.delete(element)
      }
    }
    for (const element of document.querySelectorAll<HTMLElement>(
      '[data-overview-reveal]'
    )) {
      if (!roots.has(element)) roots.set(element, setupReveal(element))
    }
  }
  mount()
  document.addEventListener('astro:before-swap', clear, {
    signal: events.signal
  })
  document.addEventListener('astro:page-load', mount, { signal: events.signal })
  window.addEventListener(
    'pagehide',
    (event) => {
      if (!event.persisted) clear()
    },
    { signal: events.signal }
  )
  window.addEventListener('pageshow', mount, { signal: events.signal })
  import.meta.hot?.dispose(() => {
    clear()
    events.abort()
  })
</script>

<style>
  [data-overview-reveal][data-reveal-pending] {
    opacity: 0;
    translate: 0 0.75rem;
  }
  @media (prefers-reduced-motion: reduce) {
    [data-overview-reveal][data-reveal-pending] {
      opacity: 1;
      translate: none;
    }
  }
</style>
```

With ordinary full-page navigation no Astro router is required. If ClientRouter
is deliberately added, its [lifecycle events](https://docs.astro.build/en/guides/view-transitions/#lifecycle-events)
clear old instances and mount the next page. HMR clears both target and lifecycle
listeners. Persisted pagehide retains controllers for BFCache; pageshow reuses
them, preserving completed targets without replay.

This static section does not watch arbitrary DOM changes. A deferred Server
Island or another dynamic owner must call setupReveal after inserting its actual
wrapper and call the returned cleanup before removal/replacement. Its placeholder
must not be a reveal target. Reuse that owner's existing mount/removal lifecycle;
do not introduce a second global mutation manager. A removed/reinserted target
must be cleaned up before its supported remount.

## Acceptance matrix

Check at narrow and wide widths, in both themes and with enlarged text:

| Situation                                                  | Expected result                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| Initial viewport, initial deep scroll, direct hash         | Visible immediately; never hidden by the first report.                      |
| Below viewport, slow/fast downward scrolling               | Only unseen offscreen targets become pending; passed targets stay natural.  |
| Animation completion and reverse scroll                    | Natural styles, no retained animation, no replay.                           |
| Keyboard focus or hash into a pending/playing target       | Immediately visible; active effect cancelled.                               |
| No JS, missing observer/animation support                  | Natural readable HTML.                                                      |
| Reduced motion at load or enabled while pending/playing    | Readable immediately; no active effect or replay after disabling reduction. |
| Multiple instances, repeated setup, cleanup twice, remount | One controller per target; no duplicated observers/listeners.               |
| Astro navigation and HMR                                   | Old effects/observers/listeners released; fresh targets mount.              |
| Actual back/forward restoration from BFCache               | Retained state; visible completed targets; no duplicate setup.              |
| Deferred Server Island insertion/removal                   | Explicit owner mounts real content and releases it before removal.          |

Synthetic pagehide/pageshow events only check listener branches; claim BFCache
coverage only after a real back/forward navigation reports persisted pageshow.
