import type { Locale } from './config'
import type { Site } from './dictionaries/en-us/site/types'
import type { Common } from './dictionaries/en-us/common/types'
import type { Buttons } from './dictionaries/en-us/buttons/types'
import type { Languages } from './dictionaries/en-us/languages/types'
import type { Navigation } from './dictionaries/en-us/navigation/types'
import type { Welcome } from './dictionaries/en-us/welcome/types'
import type { Forms } from './dictionaries/en-us/forms/types'
import type { Errors } from './dictionaries/en-us/errors/types'
import type { SEO } from './dictionaries/en-us/seo/types'
import type { Themes } from './dictionaries/en-us/themes/types'

import type { Cookies } from './dictionaries/en-us/cookies/types'
import type { Mail } from './dictionaries/en-us/mail/types'
import type { Content } from './dictionaries/en-us/content/types'

export interface Dictionary {
  content: Content
  mail: Mail
  cookies: Cookies
  themes: Themes
  seo: SEO
  site: Site
  common: Common
  buttons: Buttons
  languages: Languages
  navigation: Navigation
  welcome: Welcome
  forms: Forms
  errors: Errors
}

/** Public, page-scoped data emitted by Main when clientTranslations is enabled. */
export type ClientTranslations<Domain extends keyof Dictionary> = {
  locale: Locale
  translations: Pick<Dictionary, Domain>
}
