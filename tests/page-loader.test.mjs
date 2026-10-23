import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = await readFile(
  new URL('../src/components/PageLoader/scripts.ts', import.meta.url),
  'utf8'
)
const script = ts.transpileModule(
  source.replaceAll('export const', 'const') +
    '\nglobalThis.api = { showLoader, hideLoader }',
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }
).outputText

const runtime = () => {
  const listeners = new Map()
  const timers = new Map()
  let time = 0
  let id = 0
  let loader = { hidden: true }
  const listen = (scope) => (event, callback) => {
    const key = `${scope}:${event}`
    const callbacks = listeners.get(key) ?? []
    callbacks.push(callback)
    listeners.set(key, callbacks)
  }
  const context = {
    URL,
    location: new URL('https://example.com/current?q=1'),
    Element: { [Symbol.hasInstance]: (value) => value?.kind === 'element' },
    HTMLFormElement: {
      [Symbol.hasInstance]: (value) => value?.kind === 'form'
    },
    document: {
      querySelector: (selector) =>
        selector === '[data-page-loader]' ? loader : null,
      addEventListener: listen('document')
    },
    window: {
      addEventListener: listen('window'),
      setTimeout: (callback, delay) => {
        timers.set(++id, { callback, due: time + delay })
        return id
      },
      clearTimeout: (key) => timers.delete(key)
    }
  }
  runInNewContext(script, context)
  const emit = (scope, event, payload = {}) => {
    for (const callback of listeners.get(`${scope}:${event}`) ?? [])
      callback(payload)
  }
  return {
    ...context.api,
    listeners,
    get loader() {
      return loader
    },
    replaceLoader: () => {
      loader = { hidden: true }
    },
    emit,
    advance: (duration) => {
      const until = time + duration
      for (;;) {
        const next = [...timers].sort((a, b) => a[1].due - b[1].due)[0]
        if (!next || next[1].due > until) break
        timers.delete(next[0])
        time = next[1].due
        next[1].callback()
      }
      time = until
    }
  }
}

const attributes = (values) => ({
  getAttribute: (key) => values[key] ?? null,
  hasAttribute: (key) => Object.hasOwn(values, key)
})
const click = (app, href, attrs = {}, event = {}) => {
  const link = { href, ...attributes(attrs) }
  app.emit('window', 'click', {
    button: 0,
    target: { kind: 'element', closest: () => link },
    ...event
  })
}
const submit = (app, attrs = {}, event = {}) => {
  app.emit('window', 'submit', {
    target: {
      kind: 'form',
      method: 'get',
      action: 'https://example.com/search',
      ...attributes(attrs)
    },
    ...event
  })
}

test('loader avoids fast-navigation flashes, duplicate starts and stale timers after hiding', () => {
  const app = runtime()
  assert.equal(app.loader.hidden, true)
  app.showLoader()
  app.advance(249)
  assert.equal(app.loader.hidden, true)
  app.hideLoader()
  app.advance(1000)
  assert.equal(app.loader.hidden, true)
  app.showLoader()
  app.advance(200)
  app.showLoader()
  app.advance(50)
  assert.equal(app.loader.hidden, false)
  app.advance(9750)
  assert.equal(app.loader.hidden, true)
  assert.ok(!app.listeners.has('window:beforeunload'))
})

test('native navigation ignores anchors, downloads, other origins, new tabs and cancelled clicks', () => {
  const app = runtime()
  for (const [href, attrs, event] of [
    ['https://example.com/current?q=1#details'],
    ['https://external.example/'],
    ['mailto:hello@example.com'],
    ['https://example.com/file.pdf', { download: '' }],
    ['https://example.com/next', { target: '_blank' }],
    ['https://example.com/next', { 'data-page-loader-skip': '' }],
    ['https://example.com/next', {}, { ctrlKey: true }],
    ['https://example.com/next', {}, { metaKey: true }],
    ['https://example.com/next', {}, { shiftKey: true }],
    ['https://example.com/next', {}, { altKey: true }],
    ['https://example.com/next', {}, { button: 1 }],
    ['https://example.com/next', {}, { defaultPrevented: true }]
  ]) {
    click(app, href, attrs, event)
    app.advance(300)
    assert.equal(app.loader.hidden, true, href)
  }
  click(app, 'https://example.com/current?q=2')
  app.advance(250)
  assert.equal(app.loader.hidden, false)
  app.emit('window', 'pagehide')
  app.emit('window', 'pageshow')
  app.advance(300)
  assert.equal(app.loader.hidden, true)
})

test('native forms honor cancellation, submitter overrides, dialog forms and opt-out', () => {
  const app = runtime()
  for (const [attrs, event] of [
    [{}, { defaultPrevented: true }],
    [{ target: '_blank' }],
    [{ 'data-page-loader-skip': '' }],
    [{}, { submitter: attributes({ formtarget: '_blank' }) }],
    [{}, { submitter: attributes({ formmethod: 'dialog' }) }],
    [{}, { submitter: attributes({ formaction: 'https://external.example/' }) }]
  ]) {
    submit(app, attrs, event)
    app.advance(300)
    assert.equal(app.loader.hidden, true)
  }
  submit(
    app,
    { target: '_blank' },
    { submitter: attributes({ formtarget: '_self' }) }
  )
  app.advance(250)
  assert.equal(app.loader.hidden, false)
})

test('Astro preparation clears the loader on completion or error and older loads cannot end newer ones', async () => {
  const app = runtime()
  let finish
  const slow = {
    loader: () =>
      new Promise((resolve) => {
        finish = resolve
      })
  }
  app.emit('document', 'astro:before-preparation', slow)
  const first = slow.loader()
  app.advance(250)
  assert.equal(app.loader.hidden, false)
  const error = {
    loader: async () => {
      throw new Error('navigation failed')
    }
  }
  app.emit('document', 'astro:before-preparation', error)
  finish()
  await first
  assert.equal(app.loader.hidden, false)
  await assert.rejects(error.loader(), /navigation failed/)
  assert.equal(app.loader.hidden, true)
  app.showLoader()
  app.emit('document', 'astro:page-load')
  app.advance(300)
  assert.equal(app.loader.hidden, true)
  app.replaceLoader()
  app.showLoader()
  app.advance(250)
  assert.equal(app.loader.hidden, false)
})
