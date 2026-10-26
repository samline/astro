import { project } from '../../../shared/lib/project.mjs'
const routes = {
  overview: '',
  setup: 'getting-started/',
  options: 'reference/configuration/',
  api: 'reference/api/',
  lifecycle: 'reference/configuration/',
  accessibility: 'guides/accessibility/',
  examples: 'guides/examples/'
} as const
export type DocsRoute = keyof typeof routes
export const docsHref = (route: DocsRoute) => project.docsBase + routes[route]
