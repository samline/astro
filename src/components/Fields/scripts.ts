import { form } from '@samline/forms'
import type {
  FormController,
  FormControllerOptions,
  FormErrors
} from '@samline/forms'

export type {
  FormController,
  FormControllerOptions,
  FormErrors
} from '@samline/forms'

const controllers = new Map<HTMLFormElement, FormController>()
let listening = false

/** Create once per element; submission and validators belong to the consuming section. */
export const createForm = (
  target: HTMLFormElement | string,
  options: FormControllerOptions = {}
): FormController => {
  const element =
    typeof target === 'string' ? document.getElementById(target) : target
  if (!(element instanceof HTMLFormElement) || !element.isConnected)
    throw new Error('Expected a connected form element or form ID.')
  const existing = controllers.get(element)
  if (existing) return existing

  const initialErrors: FormErrors = Object.create(null)
  element.querySelectorAll<HTMLElement>('[data-field]').forEach((field) => {
    const name = field.dataset.fieldName
    const message = field
      .querySelector<HTMLElement>('[data-field-error]')
      ?.textContent?.trim()
    if (name && message) initialErrors[name] = [message]
  })
  const initialBusy = element.getAttribute('aria-busy')
  const controller = form(element, { autoValidate: false, ...options })
  controllers.set(element, controller)
  let resetting = false
  const resetController = controller.reset
  controller.reset = () => {
    resetting = true
    try {
      return resetController()
    } finally {
      resetting = false
    }
  }
  let resetTimer: ReturnType<typeof setTimeout> | undefined
  const reset = (event: Event) => {
    if (resetting) return
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      if (event.defaultPrevented || controllers.get(element) !== controller)
        return
      controller.reset()
    })
  }
  element.addEventListener('reset', reset)
  const unsubscribe = controller.subscribe((state) => {
    element.setAttribute('aria-busy', String(state.isSubmitting))
    element.querySelectorAll<HTMLElement>('[data-field]').forEach((field) => {
      const message = field.querySelector<HTMLElement>('[data-field-error]')
      if (!message) return
      const name = field.dataset.fieldName ?? ''
      const errors = Object.hasOwn(state.errors, name) ? state.errors[name] : []
      const text = errors.join(' ')
      // Character data updates avoid retriggering the controller's child-list observer.
      let node = message.firstChild
      if (!(node instanceof Text)) {
        node = document.createTextNode('')
        message.replaceChildren(node)
      }
      if (node.textContent !== text) node.textContent = text
      message.hidden = errors.length === 0
    })
  })
  controller.addCleanup(() => {
    unsubscribe()
    element.removeEventListener('reset', reset)
    clearTimeout(resetTimer)
    controllers.delete(element)
    if (initialBusy === null) element.removeAttribute('aria-busy')
    else element.setAttribute('aria-busy', initialBusy)
  })
  if (Object.keys(initialErrors).length) controller.setErrors(initialErrors)
  if (!listening) {
    listening = true
    document.addEventListener('astro:before-swap', () => destroyForms())
    window.addEventListener('pagehide', (event) => {
      if (!event.persisted) destroyForms()
    })
  }
  return controller
}

export const destroyForm = (target: HTMLFormElement | string) => {
  const element =
    typeof target === 'string' ? document.getElementById(target) : target
  if (element instanceof HTMLFormElement) controllers.get(element)?.destroy()
}

/** Call before removing dynamically inserted form markup. */
export const destroyForms = (root: ParentNode = document) => {
  for (const [element, controller] of controllers) {
    if (root === element || root.contains(element)) controller.destroy()
  }
}
