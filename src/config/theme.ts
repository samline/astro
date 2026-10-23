export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'

export const themeConfig: {
  defaultPreference: ThemePreference
  storageKey: string
} = {
  defaultPreference: 'system',
  storageKey: 'astro-kit:theme'
}
