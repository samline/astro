import type { Locale } from './config'
import type { RouteTable } from '../config/routes'
import enUS from './dictionaries/en-us/routes'
import esMX from './dictionaries/es-mx/routes'
import esES from './dictionaries/es-es/routes'

/** Register tables here; do not duplicate URLs in the registry. */
export const localeRoutes = {
  'en-us': enUS,
  'es-mx': esMX,
  'es-es': esES
} satisfies Record<Locale, RouteTable>
