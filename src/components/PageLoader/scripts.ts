let showTimer: number | undefined
let safetyTimer: number | undefined
let active = false
let navigation = 0

const setVisible = (visible: boolean) => {
  const loader = document.querySelector<HTMLElement>('[data-page-loader]')
  if (loader) loader.hidden = !visible
}

export const hideLoader = () => {
  window.clearTimeout(showTimer)
  window.clearTimeout(safetyTimer)
  active = false
  setVisible(false)
}

export const showLoader = () => {
  if (active || !document.querySelector('[data-page-loader]')) return
  active = true
  showTimer = window.setTimeout(() => setVisible(true), 250)
  safetyTimer = window.setTimeout(hideLoader, 10000)
}

const targetsCurrentPage = (target?: string | null) => {
  const destination =
    target ?? document.querySelector('base[target]')?.getAttribute('target')
  return !destination || destination.toLowerCase() === '_self'
}

window.addEventListener('click', (event) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !(event.target instanceof Element)
  )
    return
  const link = event.target.closest<HTMLAnchorElement>('a[href]')
  if (
    !link ||
    link.hasAttribute('download') ||
    link.hasAttribute('data-page-loader-skip') ||
    !targetsCurrentPage(link.getAttribute('target'))
  )
    return
  const url = new URL(link.href)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.origin !== location.origin ||
    (url.pathname === location.pathname && url.search === location.search)
  )
    return
  showLoader()
})

window.addEventListener('submit', (event) => {
  const form = event.target
  if (
    event.defaultPrevented ||
    !(form instanceof HTMLFormElement) ||
    form.hasAttribute('data-page-loader-skip')
  )
    return
  const submitter = event.submitter
  const target =
    submitter?.getAttribute('formtarget') ?? form.getAttribute('target')
  const method = submitter?.getAttribute('formmethod') ?? form.method
  const action = submitter?.getAttribute('formaction') ?? form.action
  if (
    method.toLowerCase() === 'dialog' ||
    !targetsCurrentPage(target) ||
    new URL(action, location.href).origin !== location.origin
  )
    return
  showLoader()
})

document.addEventListener('astro:before-preparation', (event) => {
  const currentNavigation = ++navigation
  const load = event.loader
  showLoader()
  event.loader = async () => {
    try {
      await load()
    } finally {
      if (currentNavigation === navigation) hideLoader()
    }
  }
})
document.addEventListener('astro:page-load', hideLoader)
window.addEventListener('pageshow', hideLoader)
window.addEventListener('pagehide', hideLoader)
