import vendorStyles from 'vanilla-cookieconsent/dist/cookieconsent.css?url'
import themeStyles from './consent.css?url'

export {
  run,
  reset,
  acceptedCategory,
  showPreferences
} from 'vanilla-cookieconsent'

export { createConsentConfig } from './consent'

const styles = new Map<string, Promise<void>>()

const loadStyle = (href: string): Promise<void> => {
  const existing = styles.get(href)
  if (existing) return existing
  const pending = new Promise<void>((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => resolve()
    link.onerror = () => {
      styles.delete(href)
      link.remove()
      reject(new Error('CookieConsent stylesheet could not be loaded.'))
    }
    document.head.append(link)
  })
  styles.set(href, pending)
  return pending
}

export const loadStyles = () =>
  Promise.all([loadStyle(vendorStyles), loadStyle(themeStyles)])
