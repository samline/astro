import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const markdown = await readFile(
  new URL(
    '../scripts/agent-context/.agents/memory/reveal-recipe.md',
    import.meta.url
  ),
  'utf8'
)
const source = markdown.match(/```ts\n([\s\S]*?)\n```/)[1]
const script = ts.transpileModule(
  source.replace('export const setupReveal', 'const setupReveal') +
    '\nglobalThis.setup = setupReveal',
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }
).outputText

const runtime = ({ reduced = false, supported = true, hash = '' } = {}) => {
  const observers = []
  const animations = []
  const motion = Object.assign(new EventTarget(), { matches: reduced })
  const element = Object.assign(new EventTarget(), {
    dataset: {},
    contains: (target) => target === element || target === child,
    animate: () => {
      const animation = {
        cancelled: false,
        cancel: () => {
          animation.cancelled = true
        }
      }
      animations.push(animation)
      return animation
    }
  })
  const child = {}
  const window = new EventTarget()
  const context = {
    AbortController,
    WeakMap,
    matchMedia: () => motion,
    location: { hash },
    document: {
      activeElement: null,
      documentElement: {},
      getElementById: (id) => (id === 'inside' ? child : null)
    },
    window,
    innerHeight: 800,
    getComputedStyle: () => ({ fontSize: '16px' }),
    IntersectionObserver: class {
      constructor(callback) {
        this.callback = callback
        this.disconnected = false
        observers.push(this)
      }
      observe() {}
      disconnect() {
        this.disconnected = true
      }
    }
  }
  if (supported) window.IntersectionObserver = context.IntersectionObserver
  runInNewContext(script, context)
  const report = (top, bottom = top + 100, isIntersecting = false) =>
    observers
      .at(-1)
      .callback([{ isIntersecting, boundingClientRect: { top, bottom } }])
  return {
    setup: () => context.setup(element),
    context,
    element,
    motion,
    window,
    observers,
    animations,
    report
  }
}

test('first reports preserve initial viewport, pre-entry and already-passed content', () => {
  for (const [top, intersecting] of [
    [0, true],
    [780, false],
    [820, true],
    [-200, false]
  ]) {
    const app = runtime()
    app.setup()
    app.report(top, top + 100, intersecting)
    assert.equal(app.element.dataset.revealDone, 'true')
    assert.equal(app.element.dataset.revealPending, undefined)
    assert.equal(app.animations.length, 0)
  }
})

test('unseen targets play once and completion/cancellation restores natural state', () => {
  const app = runtime()
  const cleanup = app.setup()
  assert.equal(app.setup(), cleanup)
  assert.equal(app.observers.length, 1)
  app.report(1000)
  assert.equal(app.element.dataset.revealPending, 'true')
  app.report(820, 920, true)
  assert.equal(app.element.dataset.revealPending, undefined)
  assert.equal(app.animations.length, 1)
  app.animations[0].onfinish()
  app.report(1000)
  app.report(0, 100, true)
  assert.equal(app.animations.length, 1)
  assert.equal(app.animations[0].cancelled, true)
  cleanup()
  cleanup()
  app.setup()
  assert.equal(
    app.observers.length,
    1,
    'completed DOM must not replay after remount'
  )
})

test('fast-scroll skips, focus and hash navigation immediately expose content', () => {
  for (const trigger of ['passed', 'focus', 'hash']) {
    const app = runtime()
    app.setup()
    app.report(1200)
    if (trigger === 'passed') app.report(-200, -100)
    if (trigger === 'focus') app.element.dispatchEvent(new Event('focusin'))
    if (trigger === 'hash') {
      app.context.location.hash = '#inside'
      app.window.dispatchEvent(new Event('hashchange'))
    }
    assert.equal(app.element.dataset.revealDone, 'true', trigger)
    assert.equal(app.element.dataset.revealPending, undefined)
    assert.equal(app.observers[0].disconnected, true)
  }
  const direct = runtime({ hash: '#inside' })
  direct.setup()
  assert.equal(direct.observers.length, 0)
})

test('reduced motion at load, while pending and during playback always exposes content', () => {
  for (const state of ['initial', 'pending', 'playing']) {
    const app = runtime({ reduced: state === 'initial' })
    app.setup()
    if (state !== 'initial') {
      app.report(1000)
      if (state === 'playing') app.report(810, 910, true)
      app.motion.matches = true
      app.motion.dispatchEvent(new Event('change'))
    }
    assert.equal(app.element.dataset.revealDone, 'true')
    assert.equal(app.element.dataset.revealPending, undefined)
    for (const animation of app.animations)
      assert.equal(animation.cancelled, true)
  }
  const unsupported = runtime({ supported: false })
  unsupported.setup()
  assert.equal(unsupported.observers.length, 0)
})

test('cleanup disconnects pending observers and prevents late reports from hiding content', () => {
  const app = runtime()
  const cleanup = app.setup()
  app.report(1200)
  cleanup()
  app.report(1400)
  assert.equal(app.element.dataset.revealPending, undefined)
  assert.equal(app.observers[0].disconnected, true)
})
