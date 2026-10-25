declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown> | IArguments>
    gtag?: (...args: unknown[]) => void
    samlineAstroGTM?: {
      updateConsent(choice: { analytics: boolean; marketing: boolean }): boolean
    }
  }
}

export {}
