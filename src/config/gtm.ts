export const gtmConfig: {
  consentMode: 'basic' | 'advanced'
  consentTrigger: 'interaction' | 'immediate'
  cookieName: string
  cookieDurationDays: number
  revision: number
  privacyPolicyPath: string | null
} = {
  consentMode: 'basic',
  consentTrigger: 'interaction',
  cookieName: 'astro_kit_consent',
  cookieDurationDays: 180,
  revision: 0,
  privacyPolicyPath: null
}

export const normalizeContainerId = (value?: string): string | undefined => {
  const id = value?.trim()
  if (!id) return undefined
  if (!/^GTM-[A-Z0-9]+$/.test(id)) {
    throw new Error('GTM_ID debe ser un ID de contenedor válido: GTM-XXXXXXX.')
  }
  return id
}

export const defaultTrackingEnabled = (
  env: Record<string, string | undefined>,
  site: string,
  production: boolean
): boolean => {
  const hostname = new URL(site).hostname
  const local =
    ['localhost', '127.0.0.1', '[::1]'].includes(hostname) ||
    hostname.endsWith('.localhost')
  const preview =
    env.VERCEL_ENV === 'preview' ||
    ['deploy-preview', 'branch-deploy'].includes(env.CONTEXT ?? '')
  return production && !local && !preview
}
