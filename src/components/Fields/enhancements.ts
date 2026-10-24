let listening = false

const getControl = (button: HTMLButtonElement, attribute: string) => {
  const id = button.getAttribute(attribute)
  const input = id ? button.ownerDocument.getElementById(id) : null
  return input instanceof HTMLInputElement &&
    button.closest('[data-field]')?.contains(input)
    ? input
    : null
}

export const refreshFields = (root: ParentNode = document) => {
  root
    .querySelectorAll<HTMLButtonElement>(
      '[data-password-toggle], [data-file-clear]'
    )
    .forEach((button) => {
      const password = button.hasAttribute('data-password-toggle')
      const input = getControl(
        button,
        password ? 'data-password-toggle' : 'data-file-clear'
      )
      if (!input) return
      button.disabled = input.matches(':disabled')
      if (password) {
        const shown = input.type === 'text'
        button.hidden = false
        button.setAttribute('aria-pressed', String(shown))
        const text =
          (shown ? button.dataset.hideLabel : button.dataset.showLabel) ?? ''
        if (button.textContent !== text) button.textContent = text
      } else {
        button.hidden = !input.files?.length
      }
    })
}

export const mountFields = (root: ParentNode = document) => {
  refreshFields(root)
  if (listening) return
  listening = true
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return
    const button = event.target.closest<HTMLButtonElement>(
      '[data-password-toggle], [data-file-clear]'
    )
    if (!button || button.disabled) return
    const password = button.hasAttribute('data-password-toggle')
    const input = getControl(
      button,
      password ? 'data-password-toggle' : 'data-file-clear'
    )
    if (!input || input.matches(':disabled')) return
    if (password) {
      if (input.type !== 'password' && input.type !== 'text') return
      input.type = input.type === 'password' ? 'text' : 'password'
    } else {
      if (input.type !== 'file') return
      input.value = ''
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }
    refreshFields(button.closest('[data-field]') ?? document)
    if (!password) input.focus()
  })
  document.addEventListener('change', () => refreshFields())
  document.addEventListener('reset', (event) => {
    const form = event.target
    if (!(form instanceof HTMLFormElement)) return
    queueMicrotask(() => {
      if (event.defaultPrevented) return
      form
        .querySelectorAll<HTMLButtonElement>('[data-password-toggle]')
        .forEach((button) => {
          const input = getControl(button, 'data-password-toggle')
          if (input && input.type !== 'password') input.type = 'password'
        })
      refreshFields(form)
    })
  })
  document.addEventListener('astro:page-load', () => refreshFields())
}
