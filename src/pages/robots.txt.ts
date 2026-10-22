import type { APIRoute } from 'astro'
import { SITE_INDEXABLE } from 'astro:env/server'

// Produces a real static robots.txt, including when a future project uses SSR.
export const prerender = true

export const GET: APIRoute = ({ site }) => {
  const body = SITE_INDEXABLE
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`
    : 'User-agent: *\nDisallow: /\n'
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
