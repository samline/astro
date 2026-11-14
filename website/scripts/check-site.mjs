import { checkLinks } from '../shared/scripts/check-links.mjs'
import packages from '../landing/src/i18n/translations/en/packages.ts'
import { project } from '../shared/lib/project.mjs'
const result = await checkLinks({
  directory: new URL('../landing/dist/', import.meta.url),
  site: new URL(project.url),
  externalPaths: packages.items.flatMap((item) =>
    [item.href, item.docs]
      .map((href) => new URL(href))
      .filter((url) => url.origin === new URL(project.url).origin)
      .map((url) => url.pathname)
  )
})
console.log(`Verified ${result.links} links across ${result.pages} pages.`)
