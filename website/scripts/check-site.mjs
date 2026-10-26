import { checkLinks } from '../shared/scripts/check-links.mjs'
import { project } from '../shared/lib/project.mjs'
const result = await checkLinks({
  directory: new URL('../landing/dist/', import.meta.url),
  site: new URL(project.url),
  externalPaths: ['/drawer/', '/ticker/']
})
console.log(`Verified ${result.links} links across ${result.pages} pages.`)
