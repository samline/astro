import { read } from './files.mjs'
import { environmentNames } from './features/registry.mjs'
import {
  addEnvironment,
  removeImports,
  namedImport,
  parse,
  variable
} from './syntax.mjs'

export const environmentExample = async (
  template,
  selected,
  options,
  deployment,
  tools
) => {
  const reference = await read(template, '.env.example')
  const names = environmentNames(selected, options).filter(
    (name) => name !== 'SITE_URL' && name !== 'SITE_INDEXABLE'
  )
  const values = new Map(
    [...reference.matchAll(/^# ([A-Z_]+)=(.*)$/gm)].map((match) => [
      match[1],
      match[2]
    ])
  )
  if (selected.includes('auth')) values.set('AUTH_MODE', options.authMode)
  if (selected.includes('captcha'))
    values.set('CAPTCHA_PROVIDER', options.captchaProvider)
  const lines = [
    '# Local development. Set SITE_URL to the production origin at build time.',
    'SITE_URL=http://localhost:4321',
    '# SITE_INDEXABLE=false'
  ]
  if (deployment !== 'static')
    lines.push(
      '',
      `# Persistent Server Islands key: ${tools.runner} run astro create-key`,
      '# ASTRO_KEY='
    )
  for (const name of names) lines.push(`# ${name}=${values.get(name) ?? ''}`)
  if (deployment === 'custom') lines.push('HOST=0.0.0.0', 'PORT=4321')
  return lines.join('\n') + '\n'
}

export const mergeEnvironment = async (current, template, added, options) => {
  const names = environmentNames(added, options).filter(
    (name) => !name.startsWith('SITE_')
  )
  if (!names.length) return current
  if (added.includes('gtm')) {
    variable(parse(current), 'env')
    variable(parse(current), 'site')
  }
  let result = addEnvironment(
    current,
    await read(template, 'astro.config.mjs'),
    names
  )
  if (added.includes('gtm') && result.includes('defaultTrackingEnabled('))
    result = namedImport(
      result,
      'defaultTrackingEnabled',
      './src/config/gtm.ts'
    )
  return result
}

export const withoutTrackingImport = (source) =>
  removeImports(source, ['./src/config/gtm.ts'])
