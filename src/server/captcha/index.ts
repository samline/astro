import {
  CAPTCHA_PROVIDER,
  CAPTCHA_HOSTNAMES,
  SITE_URL,
  getSecret
} from 'astro:env/server'
import { verifyToken } from './verify'

/** Provider/site settings are fixed at build time; the secret is read at runtime. */
export const verifyCaptcha = (token: string) =>
  verifyToken(token, {
    provider: CAPTCHA_PROVIDER,
    secret: getSecret('CAPTCHA_SECRET_KEY'),
    hostnames: (CAPTCHA_HOSTNAMES || new URL(SITE_URL).hostname)
      .split(',')
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean)
  })
