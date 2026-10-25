import { ActionError } from 'astro:actions'
import { getRelativeLocaleUrl } from 'astro:i18n'
import type { MiddlewareHandler } from 'astro'
import { authRoutes, authLoginPath } from '../../config/auth'
import { locales } from '../../i18n/config'
import { requestAuth } from './index'

export const authMiddleware: MiddlewareHandler = async (context, next) => {
  context.locals.auth = requestAuth(context.request, context.currentLocale)
  let parts: string[]
  try {
    parts = context.url.pathname
      .split('/')
      .filter(Boolean)
      .map((part) => {
        const value = decodeURIComponent(part)
        if (/[\\/]/.test(value)) throw new Error('Encoded separator.')
        return value
      })
  } catch {
    return new Response(null, { status: 400 })
  }
  const base = import.meta.env.BASE_URL.split('/')
    .filter(Boolean)
    .map(decodeURIComponent)
  if (base.every((part, index) => part === parts[index]))
    parts.splice(0, base.length)
  if (locales.some((locale) => locale === parts[0])) parts.shift()
  const path = '/' + parts.join('/')
  const rules = authRoutes.filter(
    (rule) =>
      path === rule.path ||
      path.startsWith(rule.path === '/' ? '/' : rule.path + '/')
  )
  if (rules.length) {
    if (context.isPrerendered)
      throw new Error(
        'Protected pages must export prerender = false. Static HTML cannot be private.'
      )
    try {
      for (const rule of rules) await context.locals.auth.requireAccess(rule)
    } catch (error) {
      if (!(error instanceof ActionError)) throw error
      if (
        error.code === 'UNAUTHORIZED' &&
        authLoginPath &&
        context.request.method === 'GET' &&
        context.request.headers.get('accept')?.includes('text/html')
      ) {
        const login = new URL(
          getRelativeLocaleUrl(
            context.currentLocale ?? locales[0],
            authLoginPath
          ),
          context.url
        )
        if (login.pathname !== context.url.pathname) {
          login.searchParams.set(
            'returnTo',
            context.url.pathname + context.url.search
          )
          return new Response(null, {
            status: 302,
            headers: {
              Location: login.pathname + login.search,
              'Cache-Control': 'private, no-store'
            }
          })
        }
      }
      return Response.json(
        { code: error.code, message: error.message },
        {
          status: error.status,
          headers: { 'Cache-Control': 'private, no-store' }
        }
      )
    }
  }
  const response = await next()
  if (rules.length) response.headers.set('Cache-Control', 'private, no-store')
  return response
}
