import type { Theme, ThemePreference } from '@/config/theme'

declare global {
  interface WindowEventMap {
    themechange: CustomEvent<{ theme: Theme; preference: ThemePreference }>
  }

  interface Window {
    samlineAstroTheme?: {
      getTheme(): Theme
      getPreference(): ThemePreference
      setPreference(preference: ThemePreference): void
      refresh(): void
    }
  }
}
