import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import { themeConfig } from '../src/config/theme.ts'

const source = await readFile(
  new URL('../src/components/Theme/Init.astro', import.meta.url),
  'utf8'
)
const script = source.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]

class Events {
  listeners = new Map()
  addEventListener(name, listener, options) {
    const listeners = this.listeners.get(name) ?? []
    listeners.push({ listener, once: options?.once })
    this.listeners.set(name, listeners)
  }
  dispatchEvent(event) {
    for (const entry of [...(this.listeners.get(event.type) ?? [])]) {
      entry.listener(event)
      if (entry.once)
        this.listeners.set(
          event.type,
          this.listeners.get(event.type).filter((item) => item !== entry)
        )
    }
  }
}

class Element {
  constructor(button) {
    this.button = button
  }
  closest() {
    return this.button
  }
}
class Button extends Element {
  hidden = true
  disabled = false
  attributes = new Map()
  constructor() {
    super()
    this.button = this
  }
  setAttribute(name, value) {
    this.attributes.set(name, value)
  }
}

function page(buttons = []) {
  return Object.assign(new Events(), {
    documentElement: { dataset: { theme: 'light' } },
    buttons,
    querySelectorAll() {
      return this.buttons
    }
  })
}

function browser({
  saved,
  dark = false,
  denied = false,
  failedOperations = false,
  defaultPreference = 'system'
} = {}) {
  const values = new Map(
    saved === undefined ? [] : [[themeConfig.storageKey, saved]]
  )
  const storage = {
    getItem(key) {
      if (failedOperations) throw new Error('blocked')
      return values.get(key) ?? null
    },
    setItem(key, value) {
      if (failedOperations) throw new Error('blocked')
      values.set(key, value)
    }
  }
  const media = Object.assign(new Events(), { matches: dark })
  const window = Object.assign(new Events(), { matchMedia: () => media })
  Object.defineProperty(window, 'localStorage', {
    get() {
      if (denied) throw new Error('blocked')
      return storage
    }
  })
  const document = page()
  const context = {
    window,
    document,
    Element,
    themeConfig: { ...themeConfig, defaultPreference },
    CustomEvent: class {
      constructor(type, options) {
        this.type = type
        this.detail = options.detail
      }
    }
  }
  const boot = () => runInNewContext(script, context)
  boot()
  return {
    window,
    document,
    media,
    values,
    storage,
    boot,
    api: window.astroKitTheme
  }
}

const checked = (button) => button.attributes.get('aria-checked')

test('theme is applied before body parsing; switches synchronize and persist a nested click', () => {
  const app = browser({ dark: true })
  assert.equal(app.document.documentElement.dataset.theme, 'dark')
  assert.equal(app.api.getPreference(), 'system')
  const first = new Button()
  const second = new Button()
  app.document.buttons = [first, second]
  app.document.dispatchEvent({ type: 'DOMContentLoaded' })
  for (const button of app.document.buttons) {
    assert.equal(button.hidden, false)
    assert.equal(checked(button), 'true')
  }
  app.document.dispatchEvent({ type: 'click', target: new Element(first) })
  assert.equal(app.api.getTheme(), 'light')
  assert.equal(app.values.get(themeConfig.storageKey), 'light')
  assert.equal(checked(second), 'false')
  assert.equal(
    browser({
      saved: app.values.get(themeConfig.storageKey),
      dark: true
    }).api.getTheme(),
    'light'
  )
  first.disabled = true
  app.document.dispatchEvent({ type: 'click', target: first })
  assert.equal(app.api.getTheme(), 'light')
})

test('system changes apply only in automatic mode; storage changes synchronize other tabs', () => {
  const app = browser()
  app.media.matches = true
  app.media.dispatchEvent({ type: 'change' })
  assert.equal(app.document.documentElement.dataset.theme, 'dark')
  app.api.setPreference('light')
  app.media.dispatchEvent({ type: 'change' })
  assert.equal(app.document.documentElement.dataset.theme, 'light')
  app.api.setPreference('system')
  assert.equal(app.api.getTheme(), 'dark')
  assert.equal(app.values.get(themeConfig.storageKey), 'system')
  app.values.set(themeConfig.storageKey, 'light')
  app.window.dispatchEvent({
    type: 'storage',
    key: themeConfig.storageKey,
    storageArea: app.storage
  })
  assert.equal(app.document.documentElement.dataset.theme, 'light')
  app.values.clear()
  app.window.dispatchEvent({
    type: 'storage',
    key: null,
    storageArea: app.storage
  })
  assert.equal(app.document.documentElement.dataset.theme, 'dark')
})

test('invalid preferences and denied storage retain functional in-memory switching', () => {
  for (const options of [
    { saved: 'invalid' },
    { denied: true },
    { failedOperations: true }
  ]) {
    const app = browser({ ...options, defaultPreference: 'dark' })
    assert.equal(app.api.getTheme(), 'dark')
    app.api.setPreference('invalid')
    assert.equal(app.api.getTheme(), 'dark')
    app.api.setPreference('light')
    assert.equal(app.document.documentElement.dataset.theme, 'light')
  }
})

test('incoming Astro pages get the current theme before swapping without duplicate listeners', () => {
  const app = browser({ saved: 'dark' })
  const next = page([new Button()])
  app.document.dispatchEvent({ type: 'astro:before-swap', newDocument: next })
  assert.equal(next.documentElement.dataset.theme, 'dark')
  assert.equal(checked(next.buttons[0]), 'true')
  app.document.documentElement = next.documentElement
  app.document.buttons = next.buttons
  app.document.dispatchEvent({ type: 'astro:page-load' })
  app.boot()
  app.boot()
  assert.equal(app.document.listeners.get('click').length, 1)
  assert.equal(app.window.listeners.get('storage').length, 1)
  app.document.dispatchEvent({ type: 'click', target: next.buttons[0] })
  assert.equal(app.api.getTheme(), 'light')
})
