type Provider = 'turnstile' | 'recaptcha'
type WidgetId = string | number
interface WidgetOptions {
  sitekey: string
  theme: 'light' | 'dark'
  size: 'normal' | 'compact'
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
  'timeout-callback'?: () => void
  'unsupported-callback'?: () => void
  'response-field'?: boolean
  language?: string
}
interface SDK {
  render: (element: HTMLElement, options: WidgetOptions) => WidgetId
  reset: (id: WidgetId) => void
  remove?: (id: WidgetId) => void
}

declare global {
  interface Window {
    turnstile?: SDK
    grecaptcha?: SDK
    samlineTurnstileReady?: () => void
    samlineRecaptchaReady?: () => void
  }
}

const loads = new Map<Provider, Promise<SDK>>()
const instances = new Map<
  HTMLElement,
  { reset: () => void; destroy: () => void }
>()

const loadSDK = (provider: Provider, language: string): Promise<SDK> => {
  const existing = loads.get(provider)
  if (existing) return existing
  const callback =
    provider === 'turnstile' ? 'samlineTurnstileReady' : 'samlineRecaptchaReady'
  const promise = new Promise<SDK>((resolve, reject) => {
    const script = document.createElement('script')
    let settled = false
    const finish = (sdk?: SDK) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      window[callback] = () => {}
      if (sdk) resolve(sdk)
      else {
        script.remove()
        reject(new Error('CAPTCHA SDK could not load.'))
      }
    }
    const timer = setTimeout(() => finish(), 20000)
    window[callback] = () =>
      finish(provider === 'turnstile' ? window.turnstile : window.grecaptcha)
    const url = new URL(
      provider === 'turnstile'
        ? 'https://challenges.cloudflare.com/turnstile/v0/api.js'
        : 'https://www.google.com/recaptcha/api.js'
    )
    url.searchParams.set('render', 'explicit')
    url.searchParams.set('onload', callback)
    if (provider === 'recaptcha') url.searchParams.set('hl', language)
    script.src = url.href
    script.async = true
    script.defer = true
    script.onerror = () => finish()
    document.head.append(script)
  }).catch((error: unknown) => {
    loads.delete(provider)
    throw error
  })
  loads.set(provider, promise)
  return promise
}

const mount = (element: HTMLElement) => {
  if (instances.has(element) || !element.isConnected) return
  const { provider, sitekey, theme, size, language = 'en' } = element.dataset
  if ((provider !== 'turnstile' && provider !== 'recaptcha') || !sitekey) return
  const container = element.querySelector<HTMLElement>('[data-captcha-widget]')
  const input = element.querySelector<HTMLInputElement>('[data-captcha-token]')
  const status = element.querySelector<HTMLElement>('[data-captcha-status]')
  const retry = element.querySelector<HTMLButtonElement>('[data-captcha-retry]')
  if (!container || !input || !status || !retry) return
  let active = true
  let sdk: SDK | undefined
  let id: WidgetId | undefined
  let resetTimer: ReturnType<typeof setTimeout> | undefined
  // Preserve the text node: SAM Forms observes child-list mutations.
  const text =
    status.firstChild instanceof Text
      ? status.firstChild
      : document.createTextNode('')
  if (!text.parentNode) status.append(text)
  const update = (token: string, message = '', canRetry = false) => {
    if (!active) return
    if (input.value !== token) {
      input.value = token
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
    if (text.data !== message) text.data = message
    retry.hidden = !canRetry
  }
  const reset = () => {
    update('', element.dataset.loading)
    if (sdk && id !== undefined) {
      try {
        sdk.reset(id)
      } catch {
        update('', element.dataset.error, true)
      }
    }
  }
  const restart = () => {
    instances.get(element)?.destroy()
    mount(element)
  }
  const form = element.closest('form')
  const onReset = (event: Event) => {
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      if (!event.defaultPrevented && active) reset()
    })
  }
  retry.addEventListener('click', restart)
  form?.addEventListener('reset', onReset)
  instances.set(element, {
    reset,
    destroy: () => {
      update('')
      active = false
      clearTimeout(resetTimer)
      retry.removeEventListener('click', restart)
      form?.removeEventListener('reset', onReset)
      try {
        if (sdk && id !== undefined) {
          if (provider === 'turnstile') sdk.remove?.(id)
          else sdk.reset(id)
        }
      } catch {
        /* A detached iframe may already have been removed. */
      }
      // Google v2 has no remove API; remount into a fresh element.
      container.replaceWith(container.cloneNode(false))
      instances.delete(element)
    }
  })
  update('', element.dataset.loading)
  void loadSDK(provider, language)
    .then((loaded) => {
      if (!active || !element.isConnected) return
      sdk = loaded
      id = sdk.render(container, {
        sitekey,
        theme:
          theme === 'auto'
            ? document.documentElement.dataset.theme === 'dark'
              ? 'dark'
              : 'light'
            : theme === 'dark'
              ? 'dark'
              : 'light',
        size: size === 'compact' ? 'compact' : 'normal',
        callback: (token) => update(token),
        'expired-callback': () => update('', element.dataset.expired, true),
        'error-callback': () => update('', element.dataset.error, true),
        ...(provider === 'turnstile'
          ? {
              language,
              'response-field': false,
              'timeout-callback': () =>
                update('', element.dataset.expired, true),
              'unsupported-callback': () =>
                update('', element.dataset.error, true)
            }
          : {})
      })
    })
    .catch(() => update('', element.dataset.error, true))
}

/** Call after inserting CAPTCHA markup dynamically. Repeated calls are safe. */
export const mountCaptchas = (root: ParentNode = document) => {
  if (root instanceof HTMLElement && root.matches('[data-captcha]')) mount(root)
  root.querySelectorAll<HTMLElement>('[data-captcha]').forEach(mount)
}

/** Reset in submission finally, after FormData has been captured and sent. */
export const resetCaptchas = (root: ParentNode = document) => {
  for (const [element, instance] of instances) {
    if (root === element || root.contains(element)) instance.reset()
  }
}

/** Call before removing dynamic markup; Astro navigation is handled automatically. */
export const destroyCaptchas = (root: ParentNode = document) => {
  for (const [element, instance] of instances) {
    if (root === element || root.contains(element)) instance.destroy()
  }
}
