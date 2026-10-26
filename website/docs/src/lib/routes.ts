import { project } from '../../../shared/lib/project.mjs'
export const href = (id: string) => {
  const route = id.replace(/(^|\/)index$/, '$1').replace(/\/$/, '')
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${route ? `${route}/` : ''}`
}

export const landingHref = (path = '') =>
  `${import.meta.env.DEV ? 'http://127.0.0.1:4330' : ''}${project.base}${path}`
