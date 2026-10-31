export const features = {
  themes: {
    label: 'Light / dark themes',
    files: [
      'src/components/Theme',
      'src/config/theme.ts',
      'src/types/theme.d.ts'
    ],
    domains: ['themes']
  },
  auth: {
    label: 'Authentication',
    files: [
      'src/server/auth',
      'src/auth',
      'src/config/auth.ts',
      'src/middleware.ts',
      'src/types/auth.d.ts'
    ],
    domains: ['auth'],
    dependencies: ['better-auth']
  },
  captcha: {
    label: 'Turnstile / reCAPTCHA',
    files: ['src/components/Captcha', 'src/server/captcha'],
    domains: ['captcha']
  },
  gtm: {
    label: 'GTM + cookie consent',
    files: ['src/components/GTM', 'src/config/gtm.ts', 'src/types/gtm.d.ts'],
    domains: ['cookies'],
    dependencies: ['vanilla-cookieconsent']
  },
  'language-picker': {
    label: 'Language picker',
    files: ['src/components/LanguagePicker'],
    domains: ['languages']
  },
  forms: {
    label: 'SAM Forms + Formatter',
    files: ['src/forms'],
    domains: [],
    dependencies: ['@samline/forms', '@samline/formatter']
  },
  fields: {
    label: 'Fields templates',
    files: ['src/components/Fields'],
    domains: ['forms'],
    requires: ['forms']
  },
  actions: {
    label: 'Actions with a basic example',
    files: ['src/actions/basic'],
    domains: ['actions']
  },
  content: { label: 'Content Collections', files: [], domains: ['content'] },
  mail: {
    label: 'SMTP + contact Action example',
    files: ['src/server/mail', 'src/actions/contact'],
    domains: ['mail', 'forms'],
    dependencies: ['nodemailer'],
    devDependencies: ['@types/nodemailer']
  },
  pageloader: {
    label: 'PageLoader',
    files: ['src/components/PageLoader'],
    domains: [],
    dependencies: ['ldrs']
  },
  faicon: {
    label: 'Font Awesome SVG icons',
    files: ['src/components/FaIcon'],
    domains: [],
    dependencies: [
      '@fortawesome/fontawesome-common-types',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/free-regular-svg-icons',
      '@fortawesome/free-solid-svg-icons'
    ]
  },
  welcome: {
    label: 'Starter demo: header, navigation and two pages',
    files: [
      'src/assets/astro.svg',
      'src/sections/Welcome',
      'src/sections/DemoHeader',
      'src/sections/DemoFooter',
      'src/sections/DemoPage',
      'src/pages/[...locale]/demo.astro'
    ],
    domains: ['welcome', 'navigation']
  }
}
export const coreDomains = ['site', 'common', 'buttons', 'errors', 'seo']
export const coreFiles = [
  'licenses',
  'THIRD_PARTY_NOTICES.md',
  'public',
  'src/components/Box',
  'src/components/Section',
  'src/components/Link',
  'src/components/Button',
  'src/components/H',
  'src/components/SEO',
  'src/sections/NotFound',
  'src/pages/404.astro',
  'src/pages/[...locale]/index.astro',
  'src/pages/robots.txt.ts',
  'src/config/seo.ts',
  'src/config/routes.ts',
  'src/styles',
  'src/i18n/routes.ts',
  'src/i18n/route-tables.ts',
  'src/i18n/README.md',
  'src/i18n/localized-content.md',
  'astro.config.mjs',
  'tsconfig.json',
  'bunfig.toml',
  'vercel.json',
  '.editorconfig',
  '.env.example',
  '_gitignore',
  '.nvmrc',
  '.prettierrc.mjs',
  '.prettierignore',
  '.vscode',
  'scripts/check-i18n.mjs',
  'scripts/check-translations.mjs',
  'scripts/dictionary.mjs'
]
export const sources = ['local', 'api', 'strapi', 'shopify', 'other']
export const authModes = ['external', 'database', 'oauth']

export const resolveFeatures = (requested = []) => {
  const result = new Set()
  const include = (name) => {
    if (!Object.hasOwn(features, name))
      throw new Error(`Unknown integration: ${name}`)
    for (const dependency of features[name].requires ?? []) include(dependency)
    result.add(name)
  }
  for (const name of requested) include(name)
  return [...result]
}
export const domainsFor = (selected) => [
  ...new Set([
    ...coreDomains,
    ...selected.flatMap((name) => features[name].domains)
  ])
]
export const environmentNames = (selected, options) => {
  const names = ['SITE_URL', 'SITE_INDEXABLE']
  if (selected.includes('gtm')) names.push('GTM_ID', 'GTM_ENABLED')
  if (selected.includes('mail'))
    names.push(
      'MAIL_ENABLED',
      'MAIL_FROM',
      'MAIL_TO',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_SECURE',
      'SMTP_USER',
      'SMTP_PASSWORD'
    )
  if (selected.includes('captcha'))
    names.push(
      'CAPTCHA_PROVIDER',
      'CAPTCHA_SITE_KEY',
      'CAPTCHA_SECRET_KEY',
      'CAPTCHA_HOSTNAMES'
    )
  if (selected.includes('auth')) {
    names.push('AUTH_MODE', 'AUTH_SECRET', 'AUTH_URL', 'AUTH_SESSION_SECONDS')
    if (options.authMode === 'database') names.push('AUTH_DATABASE_URL')
    if (options.authMode === 'external')
      names.push(
        'AUTH_API_URL',
        'AUTH_API_KEY',
        'AUTH_API_LOGIN_PATH',
        'AUTH_API_PROFILE_PATH',
        'AUTH_API_REFRESH_PATH',
        'AUTH_API_LOGOUT_PATH'
      )
    if (options.authMode === 'oauth')
      names.push(
        'AUTH_OAUTH_DISCOVERY_URL',
        'AUTH_OAUTH_CLIENT_ID',
        'AUTH_OAUTH_CLIENT_SECRET'
      )
  }
  return names
}
export const validateOptions = (selected, options, deployment) => {
  if (selected.includes('auth') && !authModes.includes(options.authMode))
    throw new Error('Choose --auth-mode external | database | oauth.')
  if (
    selected.includes('captcha') &&
    !['turnstile', 'recaptcha'].includes(options.captchaProvider)
  )
    throw new Error('Choose --captcha-provider turnstile | recaptcha.')
  if (selected.includes('content')) {
    if (!sources.includes(options.contentSource))
      throw new Error('Choose --source local | api | strapi | shopify | other.')
    if (!['build', 'live'].includes(options.contentMode ?? 'build'))
      throw new Error('Choose --content-mode build | live.')
    if (options.contentMode === 'live' && options.contentSource === 'local')
      throw new Error('Local files use build-time collections.')
    if (!/^[a-z][a-zA-Z0-9]*$/.test(options.collection ?? 'posts'))
      throw new Error('Use a collection identifier such as posts or products.')
    const identifier = options.collection ?? 'posts'
    const reserved = new Set([
      'break',
      'case',
      'catch',
      'class',
      'const',
      'continue',
      'debugger',
      'default',
      'delete',
      'do',
      'else',
      'enum',
      'export',
      'extends',
      'false',
      'finally',
      'for',
      'function',
      'if',
      'import',
      'in',
      'instanceof',
      'new',
      'null',
      'return',
      'super',
      'switch',
      'this',
      'throw',
      'true',
      'try',
      'typeof',
      'var',
      'void',
      'while',
      'with',
      'await',
      'yield',
      'let',
      'static',
      'implements',
      'interface',
      'package',
      'private',
      'protected',
      'public',
      'eval',
      'arguments',
      'collections',
      'schema',
      'sourceLoader',
      'sourceLiveLoader',
      'fetchEntries',
      'loader',
      'defineCollection',
      'defineLiveCollection'
    ])
    if (reserved.has(identifier))
      throw new Error(
        `Reserved collection identifier: ${identifier}. Choose a name such as posts or products.`
      )
    if (
      ['api', 'other'].includes(options.contentSource) &&
      !['rest', 'graphql'].includes(options.protocol)
    )
      throw new Error('Choose --protocol rest | graphql for the API example.')
  }
  const needsServer =
    selected.includes('auth') ||
    selected.includes('actions') ||
    selected.includes('mail') ||
    options.contentMode === 'live'
  if (deployment === 'static' && needsServer && !options.scaffold)
    throw new Error(
      'These integrations need a server adapter. Choose an adapter, omit them, or use --scaffold for explicitly inactive examples.'
    )
  if (
    deployment === 'cloudflare' &&
    (selected.includes('mail') ||
      (selected.includes('auth') && options.authMode === 'database')) &&
    !options.scaffold
  )
    throw new Error(
      'SMTP/PostgreSQL require a verified Workers transport. Choose another deployment or --scaffold for inactive examples.'
    )
}
