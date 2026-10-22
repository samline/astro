import type { Site } from './dictionaries/en-us/site/types'
import type { Common } from './dictionaries/en-us/common/types'
import type { Buttons } from './dictionaries/en-us/buttons/types'
import type { Languages } from './dictionaries/en-us/languages/types'
import type { Navigation } from './dictionaries/en-us/navigation/types'
import type { Welcome } from './dictionaries/en-us/welcome/types'
import type { Forms } from './dictionaries/en-us/forms/types'
import type { Errors } from './dictionaries/en-us/errors/types'

import type { SEO } from './dictionaries/en-us/seo/types'

export interface Dictionary {
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
