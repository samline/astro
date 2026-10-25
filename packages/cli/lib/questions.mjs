import { createInterface } from 'node:readline/promises'
import { features, sources, authModes } from './features/registry.mjs'
import { presets, normalizeLocale } from './locales.mjs'
import { deployments } from './deployment.mjs'

export const askQuestions = async ({
  command,
  directory,
  requested,
  options,
  deployment,
  locale,
  additionalLocales = [],
  installed = []
}) => {
  const controller = new AbortController()
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const cancel = () => {
    controller.abort()
    prompt.close()
  }
  process.once('SIGINT', cancel)
  const ask = async (message, fallback = '') =>
    (
      await prompt.question(`${message}${fallback ? ` [${fallback}]` : ''}: `, {
        signal: controller.signal
      })
    ).trim() || fallback
  const choose = async (message, choices, fallback) => {
    console.log('\n' + message)
    choices.forEach(([value, label], index) =>
      console.log(`  ${index + 1}. ${label} (${value})`)
    )
    while (true) {
      const answer = await ask('Choose', fallback)
      const found = choices.find(
        ([value], index) => value === answer || String(index + 1) === answer
      )
      if (found) return found[0]
      console.log('Choose a listed option.')
    }
  }
  const language = async () => {
    const code = await choose(
      'Default language',
      [
        ...Object.entries(presets).map(([key, item]) => [key, item.name]),
        ['other', 'Enter another language']
      ],
      'en-us'
    )
    if (code !== 'other') return { code, ...presets[code] }
    return {
      code: normalizeLocale(await ask('Language tag (for example pt-br)')),
      name: await ask('Native language name'),
      direction: await choose(
        'Text direction',
        [
          ['ltr', 'Left to right'],
          ['rtl', 'Right to left']
        ],
        'ltr'
      )
    }
  }
  try {
    if (command === 'locale') {
      locale = normalizeLocale(locale)
      if (!presets[locale] && !options.localeName)
        options.localeName = await ask('Native language name')
      if (!presets[locale] && !options.direction)
        options.direction = await choose(
          'Text direction',
          [
            ['ltr', 'Left to right'],
            ['rtl', 'Right to left']
          ],
          'ltr'
        )
      return { locale, options }
    }
    if (command === 'create') {
      directory ||= await ask('Project folder', 'my-project')
      if (!locale) {
        const selected = await language()
        locale = selected.code
        options.localeName = selected.name
        options.direction = selected.direction
      }
      if (!presets[normalizeLocale(locale)] && !options.localeName)
        options.localeName = await ask('Native language name')
      if (!presets[normalizeLocale(locale)] && !options.direction)
        options.direction = await choose(
          'Text direction',
          [
            ['ltr', 'Left to right'],
            ['rtl', 'Right to left']
          ],
          'ltr'
        )
      const others = await ask(
        'Additional languages, comma separated (blank for one language)',
        additionalLocales.join(',')
      )
      additionalLocales = []
      for (const value of others
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)) {
        const code = normalizeLocale(value)
        additionalLocales.push(
          presets[code]
            ? code
            : {
                code,
                name: await ask(`Native name for ${code}`),
                direction: await choose(
                  `Direction for ${code}`,
                  [
                    ['ltr', 'Left to right'],
                    ['rtl', 'Right to left']
                  ],
                  'ltr'
                )
              }
        )
      }
      deployment ||= await choose(
        'Deployment',
        Object.entries(deployments).map(([key, item]) => [key, item.label]),
        'vercel'
      )
    }
    if (requested === undefined) {
      const available = Object.entries(features).filter(
        ([name]) => !installed.includes(name) || name === 'content'
      )
      console.log('\nOptional integrations (blank for core only):')
      available.forEach(([name, item], index) =>
        console.log(`  ${index + 1}. ${item.label} (${name})`)
      )
      while (true) {
        const answer = await ask('Names or numbers, comma separated')
        const choices = answer
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .map(
            (value) =>
              available.find(
                ([name], index) => value === name || value === String(index + 1)
              )?.[0]
          )
        if (choices.every(Boolean)) {
          requested = [...new Set(choices)]
          break
        }
        console.log('Choose only listed integration names/numbers.')
      }
    }
    if (
      requested.includes('forms') &&
      !requested.includes('fields') &&
      !installed.includes('fields') &&
      (await choose(
        'Include the Fields template too?',
        [
          ['no', 'Packages only'],
          ['yes', 'Packages and Fields']
        ],
        'no'
      )) === 'yes'
    )
      requested.push('fields')
    if (requested.includes('auth') && !options.authMode)
      options.authMode = await choose(
        'Who owns user identity?',
        authModes.map((key) => [
          key,
          {
            external: 'External REST API',
            database: 'Project-owned PostgreSQL',
            oauth: 'OAuth / OIDC'
          }[key]
        ]),
        'external'
      )
    if (requested.includes('captcha') && !options.captchaProvider)
      options.captchaProvider = await choose(
        'CAPTCHA provider',
        [
          ['turnstile', 'Cloudflare Turnstile'],
          ['recaptcha', 'Google reCAPTCHA v2']
        ],
        'turnstile'
      )
    if (requested.includes('content')) {
      options.contentSource ||= await choose(
        'Where will collection data come from?',
        sources.map((key) => [
          key,
          {
            local: 'Local files',
            api: 'REST / GraphQL API',
            strapi: 'Strapi 5',
            shopify: 'Shopify Storefront',
            other: 'Another service'
          }[key]
        ]),
        'local'
      )
      options.collection ||= await ask(
        'Collection name',
        options.contentSource === 'shopify' ? 'products' : 'posts'
      )
      if (['api', 'other'].includes(options.contentSource))
        options.protocol ||= await choose(
          'API protocol',
          [
            ['rest', 'REST'],
            ['graphql', 'GraphQL']
          ],
          'rest'
        )
      if (options.contentSource === 'other')
        options.service ||= await ask('Service name')
      options.contentMode ||=
        options.contentSource === 'local'
          ? 'build'
          : await choose(
              'When should data be fetched?',
              [
                ['build', 'During the SSG build'],
                ['live', 'Per request (Live Collection)']
              ],
              'build'
            )
    }
    const needsBackend =
      requested.some((name) => ['auth', 'mail', 'actions'].includes(name)) ||
      options.contentMode === 'live'
    if (deployment === 'static' && needsBackend && !options.scaffold) {
      console.log(
        '\nThese features require server execution. Public pages can remain SSG.'
      )
      const choice = await choose(
        'Choose a server adapter or keep explicitly inactive examples',
        [
          ...Object.entries(deployments)
            .filter(([key]) => key !== 'static')
            .map(([key, item]) => [key, item.label]),
          ['scaffold', 'Inactive examples only']
        ],
        'vercel'
      )
      if (command === 'add' && choice !== 'scaffold')
        throw new Error(
          'Changing an existing deployment requires a separate reviewed adapter change. No files were changed.'
        )
      if (choice === 'scaffold') options.scaffold = true
      else deployment = choice
    }
    if (
      deployment === 'cloudflare' &&
      (requested.includes('mail') ||
        (requested.includes('auth') && options.authMode === 'database')) &&
      !options.scaffold
    )
      options.scaffold =
        (await choose(
          'SMTP/PostgreSQL need a verified Workers transport. Scaffold inactive examples?',
          [
            ['no', 'Cancel and choose a compatible target'],
            ['yes', 'Inactive transport examples']
          ],
          'no'
        )) === 'yes'
    return {
      directory,
      requested,
      options,
      deployment,
      locale,
      additionalLocales
    }
  } finally {
    process.removeListener('SIGINT', cancel)
    prompt.close()
  }
}
