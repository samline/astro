import type { CookieConsentConfig } from 'vanilla-cookieconsent'
import type { Dictionary } from '@/i18n/types'
type Cookies = Dictionary['cookies']
import { gtmConfig } from '@/config/gtm'

const escapeConsentText = (value: string): string => {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return value.replace(/[&<>"']/g, (character) => entities[character])
}

export const createConsentConfig = (
  locale: string,
  text: Cookies,
  onConsent: () => void,
  policyHref?: string
): CookieConsentConfig => {
  const t = { ...text }
  for (const key of Object.keys(text) as Array<keyof Cookies>) {
    t[key] = escapeConsentText(text[key])
  }
  return {
    mode: 'opt-in',
    hideFromBots: false,
    disablePageInteraction: true,
    revision: gtmConfig.revision,
    cookie: {
      name: gtmConfig.cookieName,
      expiresAfterDays: gtmConfig.cookieDurationDays,
      sameSite: 'Lax'
    },
    guiOptions: {
      consentModal: {
        layout: 'box inline',
        position: 'bottom center',
        equalWeightButtons: false,
        flipButtons: true
      },
      preferencesModal: {
        layout: 'box',
        equalWeightButtons: false,
        flipButtons: true
      }
    },
    onConsent,
    onChange: onConsent,
    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: {
        enabled: false,
        autoClear: { cookies: [{ name: /^(_ga|_gid|_gat)/ }] }
      },
      marketing: {
        enabled: false,
        autoClear: { cookies: [{ name: /^(_gcl|_fbp)/ }] }
      }
    },
    language: {
      default: locale,
      translations: {
        [locale]: {
          consentModal: {
            title: t.title,
            description: t.description,
            acceptAllBtn: t.acceptAll,
            acceptNecessaryBtn: t.rejectOptional,
            showPreferencesBtn: t.preferences,
            footer: policyHref
              ? `<a href="${escapeConsentText(policyHref)}">${t.privacyPolicy}</a>`
              : undefined
          },
          preferencesModal: {
            title: t.preferences,
            acceptAllBtn: t.acceptAll,
            acceptNecessaryBtn: t.rejectOptional,
            savePreferencesBtn: t.savePreferences,
            closeIconLabel: t.close,
            sections: [
              { description: t.preferencesDescription },
              {
                title: t.necessaryTitle,
                description: t.necessaryDescription,
                linkedCategory: 'necessary'
              },
              {
                title: t.analyticsTitle,
                description: t.analyticsDescription,
                linkedCategory: 'analytics'
              },
              {
                title: t.marketingTitle,
                description: t.marketingDescription,
                linkedCategory: 'marketing'
              }
            ]
          }
        }
      }
    }
  }
}
